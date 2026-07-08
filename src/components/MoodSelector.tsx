import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  I18nManager,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useLanguage } from '../i18n/LanguageContext';

// ─── Zone table ───────────────────────────────────────────────────────────────

interface Zone {
  min: number;
  max: number;
  labelKey: string;
  rgb: [number, number, number];
}

const ZONES: Zone[] = [
  { min: 0,      max: 14.286, labelKey: 'mood.veryUnpleasant',     rgb: [91,  58,  140] },
  { min: 14.286, max: 28.571, labelKey: 'mood.unpleasant',         rgb: [108, 78,  168] },
  { min: 28.571, max: 42.857, labelKey: 'mood.slightlyUnpleasant', rgb: [88,  118, 196] },
  { min: 42.857, max: 57.143, labelKey: 'mood.neutral',            rgb: [55,  130, 210] },
  { min: 57.143, max: 71.429, labelKey: 'mood.slightlyPleasant',   rgb: [80,  190, 180] },
  { min: 71.429, max: 85.714, labelKey: 'mood.pleasant',           rgb: [230, 150, 40]  },
  { min: 85.714, max: 100,    labelKey: 'mood.veryPleasant',       rgb: [230, 108, 22]  },
];

function getZone(v: number): Zone {
  const clamped = Math.max(0, Math.min(100, v));
  return ZONES.find(z => clamped >= z.min && clamped < z.max) ?? ZONES[ZONES.length - 1];
}

// ─── Color interpolation ──────────────────────────────────────────────────────

function lerpRGB(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + t * (b[0] - a[0])),
    Math.round(a[1] + t * (b[1] - a[1])),
    Math.round(a[2] + t * (b[2] - a[2])),
  ];
}

function getRGB(v: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(100, v));
  for (let i = 0; i < ZONES.length - 1; i++) {
    const a = ZONES[i];
    const b = ZONES[i + 1];
    if (clamped >= a.min && clamped < b.min) {
      const t = (clamped - a.min) / (b.min - a.min);
      return lerpRGB(a.rgb, b.rgb, t);
    }
  }
  return ZONES[ZONES.length - 1].rgb;
}

function toHex(rgb: [number, number, number]): string {
  return `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

function toRGBA(rgb: [number, number, number], a: number): string {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

// ─── Shape generation ─────────────────────────────────────────────────────────
// Polar flower/star: r(θ) = R * (1 + amp * cos(n * θ))
// Unpleasant end → 8 sharp petals; neutral → smooth circle; pleasant → 5 soft petals

function buildPath(value: number, cx: number, cy: number, R: number): string {
  const t = value / 100;

  // Interpolate petal count (non-integer works fine with cos)
  const numPetals = 8 - t * 3; // 8 → 5

  // Amplitude: 0 at neutral (t=0.5), grows toward both extremes
  let amp: number;
  if (t <= 0.5) {
    amp = 0.40 * (1 - t * 2); // 0.40 → 0
  } else {
    amp = 0.28 * ((t - 0.5) * 2); // 0 → 0.28
  }

  const N = 120;
  const parts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const θ = (i / N) * 2 * Math.PI - Math.PI / 2;
    const r = R * (1 + amp * Math.cos(numPetals * θ));
    const x = (cx + r * Math.cos(θ)).toFixed(2);
    const y = (cy + r * Math.sin(θ)).toFixed(2);
    parts.push(i === 0 ? `M${x} ${y}` : `L${x} ${y}`);
  }
  return parts.join(' ') + ' Z';
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface MoodSelectorProps {
  visible: boolean;
  initialValue?: number; // 0–100; defaults to 50
  onSave: (value: number) => void; // called on "Next" press
  onClose: () => void;             // called on X/back without saving
}

const THUMB_SIZE = 26;

export function MoodSelector({ visible, initialValue = 50, onSave, onClose }: MoodSelectorProps) {
  const { width: screenW } = useWindowDimensions();
  const { t } = useLanguage();
  const [value, setValue] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  // Breathing animation (pauses while dragging)
  const breathe = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isDragging) { breathe.stopAnimation(); breathe.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.06, duration: 1900, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0.95, duration: 1900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isDragging]);

  // Slider geometry refs (set from onLayout — no setState to avoid render storm)
  const trackWidthRef = useRef(screenW - 48);
  const valueRef = useRef(value);
  const panStartValRef = useRef(value);
  const panStartXRef = useRef(0);

  valueRef.current = value;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gs) => {
        setIsDragging(true);
        panStartValRef.current = valueRef.current;
        panStartXRef.current = gs.x0;
        // Immediate seek on tap via locationX
        const pct = e.nativeEvent.locationX / trackWidthRef.current;
        setValue(Math.max(0, Math.min(100, pct * 100)));
      },
      onPanResponderMove: (_e, gs) => {
        const delta = (gs.moveX - panStartXRef.current) / trackWidthRef.current;
        const next = panStartValRef.current + delta * 100;
        setValue(Math.max(0, Math.min(100, next)));
      },
      onPanResponderRelease: () => setIsDragging(false),
      onPanResponderTerminate: () => setIsDragging(false),
    }),
  ).current;

  // Derived display values
  const rgb = getRGB(value);
  const accentHex = toHex(rgb);
  const zone = getZone(value);

  // SVG shape dimensions
  const SVG_SIZE = Math.min(screenW * 0.74, 290);
  const cx = SVG_SIZE / 2;
  const cy = SVG_SIZE / 2;
  const R = SVG_SIZE * 0.265;

  // Thumb position within track
  const thumbLeft = (value / 100) * (trackWidthRef.current - THUMB_SIZE);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent>
      <View style={s.root}>
        {/* Dynamic screen tint — dark base with color wash */}
        <View style={[StyleSheet.absoluteFill, s.baseDark]} pointerEvents="none" />
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: toRGBA(rgb, 0.18) }]}
          pointerEvents="none"
        />

        {/* ── Header ── */}
        <View style={s.header}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={[s.headerBtn, { borderColor: toRGBA(rgb, 0.50) }]}
          >
            <Text style={[s.headerBtnText, { color: accentHex }]}>
              {I18nManager.isRTL ? '›' : '‹'}
            </Text>
          </Pressable>
          <Text style={s.headerTitle}>{t('mood.emotion')}</Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={[s.headerBtn, { borderColor: toRGBA(rgb, 0.50) }]}
          >
            <Text style={[s.headerBtnText, s.closeTxt]}>✕</Text>
          </Pressable>
        </View>

        {/* ── Prompt ── */}
        <Text style={s.prompt}>{t('mood.prompt')}</Text>

        {/* ── Morphing shape ── */}
        <Animated.View style={{ transform: [{ scale: breathe }] }}>
          <Svg width={SVG_SIZE} height={SVG_SIZE}>
            {/* Outermost glow halos */}
            <Path d={buildPath(value, cx, cy, R)} transform={`scale(1.72) translate(${cx * (1 - 1/1.72)} ${cy * (1 - 1/1.72)})`} fill={toRGBA(rgb, 0.05)} />
            <Path d={buildPath(value, cx, cy, R)} transform={`scale(1.45) translate(${cx * (1 - 1/1.45)} ${cy * (1 - 1/1.45)})`} fill={toRGBA(rgb, 0.09)} />

            {/* Stroke-only outer rings */}
            <Path
              d={buildPath(value, cx, cy, R * 1.38)}
              fill="none"
              stroke={toRGBA(rgb, 0.22)}
              strokeWidth={1.2}
            />
            <Path
              d={buildPath(value, cx, cy, R * 1.20)}
              fill="none"
              stroke={toRGBA(rgb, 0.40)}
              strokeWidth={1.4}
            />

            {/* Main filled shape */}
            <Path d={buildPath(value, cx, cy, R)} fill={toRGBA(rgb, 0.60)} />

            {/* Bright inner core */}
            <Path d={buildPath(value, cx, cy, R * 0.65)} fill={toRGBA(rgb, 0.85)} />

            {/* White center dot */}
            <Circle cx={cx} cy={cy} r={R * 0.07} fill="rgba(255,255,255,0.65)" />
          </Svg>
        </Animated.View>

        {/* ── Zone label ── */}
        <Text style={s.zoneLabel}>{t(zone.labelKey)}</Text>

        {/* ── Slider ── */}
        <View style={s.sliderWrap}>
          <View
            style={s.track}
            onLayout={e => { trackWidthRef.current = e.nativeEvent.layout.width; }}
            {...panResponder.panHandlers}
          >
            {/* Thumb */}
            <View
              style={[
                s.thumb,
                { left: thumbLeft, backgroundColor: '#FFFFFF' },
              ]}
            />
          </View>

          <View style={s.sliderLabels}>
            <Text style={s.sliderEdge}>{t('mood.edgeLow')}</Text>
            <Text style={s.sliderEdge}>{t('mood.edgeHigh')}</Text>
          </View>
        </View>

        {/* ── Next button ── */}
        <Pressable
          onPress={() => onSave(value)}
          style={({ pressed }) => [s.nextBtn, { backgroundColor: accentHex, opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={s.nextBtnTxt}>{t('mood.next')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  baseDark: {
    backgroundColor: '#111118',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400',
  },
  closeTxt: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  prompt: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 20,
  },
  zoneLabel: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 28,
    letterSpacing: 0.2,
  },
  sliderWrap: {
    width: '100%',
    marginBottom: 32,
  },
  track: {
    width: '100%',
    height: 46,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 23,
    justifyContent: 'center',
    overflow: 'visible',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    top: (46 - THUMB_SIZE) / 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sliderEdge: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.5,
  },
  nextBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  nextBtnTxt: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
