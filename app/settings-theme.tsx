import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../src/i18n/LanguageContext';
import { ACCENT_COLORS, GRADIENT_PRESETS, useSettingsStore } from '../src/store/useSettingsStore';
import { type ThemeMode, useTheme } from '../src/theme/ThemeContext';

// ─── Gradient preview (no expo-linear-gradient — interpolate with strips) ────

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function lerpColor(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const bl = Math.round(ca.b + (cb.b - ca.b) * t);
  return `rgb(${r},${g},${bl})`;
}

const STRIPS = 24;

function GradientRect({ start, end, style }: { start: string; end: string; style?: object }) {
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      {Array.from({ length: STRIPS }, (_, i) => (
        <View
          key={i}
          style={{ flex: 1, backgroundColor: lerpColor(start, end, i / (STRIPS - 1)) }}
        />
      ))}
    </View>
  );
}

function PhonePreview({ start, end }: { start: string; end: string }) {
  return (
    <View style={preview.frame}>
      {/* notch */}
      <View style={preview.notch} />
      <GradientRect start={start} end={end} style={{ flex: 1 }} />
      {/* home bar */}
      <View style={preview.homeBar} />
    </View>
  );
}

const preview = StyleSheet.create({
  frame: {
    width: 130,
    height: 220,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  notch: {
    width: 50,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
    marginTop: 8,
    zIndex: 2,
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
  },
  homeBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
  },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ThemeScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const settings = useSettingsStore();

  const modes: { key: ThemeMode; icon: string; labelKey: string }[] = [
    { key: 'light',  icon: '☀️',  labelKey: 'theme.light'  },
    { key: 'dark',   icon: '🌙',  labelKey: 'theme.dark'   },
    { key: 'system', icon: '⚙️',  labelKey: 'theme.system' },
  ];

  const randomize = () => {
    const idx = Math.floor(Math.random() * GRADIENT_PRESETS.length);
    const p = GRADIENT_PRESETS[idx];
    settings.update({ customBgPresetIndex: idx, customBgStart: p.start, customBgEnd: p.end });
  };

  const selectPreset = (idx: number) => {
    const p = GRADIENT_PRESETS[idx];
    settings.update({ customBgPresetIndex: idx, customBgStart: p.start, customBgEnd: p.end });
  };

  const selectStartColor = (color: string) => settings.update({ customBgStart: color });
  const selectEndColor = (color: string) => settings.update({ customBgEnd: color });

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Appearance mode ──────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: theme.colors.textSecondary }]}>
          {t('settings.appearanceMode')}
        </Text>
        <View style={[s.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[s.segment, { backgroundColor: theme.colors.surfaceRaised, borderRadius: theme.radius.lg, padding: 4, gap: 4 }]}>
            {modes.map(({ key, icon, labelKey }) => {
              const active = theme.mode === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => theme.setMode(key)}
                  style={[
                    s.segBtn,
                    {
                      backgroundColor: active ? theme.colors.primary : 'transparent',
                      borderRadius: theme.radius.md,
                    },
                  ]}
                >
                  <Text style={s.segIcon}>{icon}</Text>
                  <Text style={[s.segLabel, { color: active ? '#fff' : theme.colors.textSecondary }]}>
                    {t(labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Accent color ─────────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: theme.colors.textSecondary, marginTop: 20 }]}>
          {t('settings.themeColor')}
        </Text>
        <View style={[s.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, padding: 16 }]}>
          <View style={s.colorRow}>
            {ACCENT_COLORS.map((color, idx) => {
              const active = settings.accentColorIndex === idx;
              return (
                <Pressable
                  key={color}
                  onPress={() => settings.update({ accentColorIndex: idx })}
                  style={[
                    s.colorDot,
                    { backgroundColor: color },
                    active && { borderWidth: 3, borderColor: '#fff' },
                  ]}
                >
                  {active && (
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Custom Background ────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: theme.colors.textSecondary, marginTop: 20 }]}>
          {t('settings.customBackground')}
        </Text>
        <View style={[s.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {/* Toggle row */}
          <View style={[s.toggleRow, { borderBottomWidth: settings.customBgEnabled ? StyleSheet.hairlineWidth : 0, borderBottomColor: theme.colors.border }]}>
            <Text style={[s.rowLabel, { color: theme.colors.textPrimary }]}>
              {t('settings.customBackground')}
            </Text>
            <Switch
              value={settings.customBgEnabled}
              onValueChange={(v) => settings.update({ customBgEnabled: v })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {settings.customBgEnabled && (
            <>
              {/* Preset swatches */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.presetsRow}
              >
                {GRADIENT_PRESETS.map(({ start, end }, idx) => (
                  <Pressable key={idx} onPress={() => selectPreset(idx)}>
                    <GradientRect
                      start={start}
                      end={end}
                      style={[
                        s.presetSwatch,
                        settings.customBgPresetIndex === idx && { borderWidth: 3, borderColor: theme.colors.primary },
                      ]}
                    />
                    {settings.customBgPresetIndex === idx && (
                      <View style={s.presetCheck}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </ScrollView>

              {/* Divider */}
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginHorizontal: 14 }} />

              {/* Start Color section */}
              <View style={[s.colorPickSection, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border }]}>
                <View style={s.colorPickHeader}>
                  <View style={[s.iconBox, { backgroundColor: settings.customBgStart }]} />
                  <Text style={[s.rowLabel, { color: theme.colors.textPrimary }]}>
                    {t('settings.startColor')}
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.colorDotsRow}>
                  {ACCENT_COLORS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => selectStartColor(c)}
                      style={[
                        s.miniDot,
                        { backgroundColor: c },
                        settings.customBgStart === c && { borderWidth: 2, borderColor: '#fff' },
                      ]}
                    />
                  ))}
                </ScrollView>
              </View>

              {/* End Color section */}
              <View style={s.colorPickSection}>
                <View style={s.colorPickHeader}>
                  <View style={[s.iconBox, { backgroundColor: settings.customBgEnd }]} />
                  <Text style={[s.rowLabel, { color: theme.colors.textPrimary }]}>
                    {t('settings.endColor')}
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.colorDotsRow}>
                  {ACCENT_COLORS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => selectEndColor(c)}
                      style={[
                        s.miniDot,
                        { backgroundColor: c },
                        settings.customBgEnd === c && { borderWidth: 2, borderColor: '#fff' },
                      ]}
                    />
                  ))}
                </ScrollView>
              </View>

              {/* Live phone preview + Randomize */}
              <View style={s.previewSection}>
                <Pressable
                  onPress={randomize}
                  style={[s.randomizeBtn, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={s.randomizeText}>{t('settings.randomize')}</Text>
                </Pressable>
                <PhonePreview start={settings.customBgStart} end={settings.customBgEnd} />
              </View>
            </>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },

  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Appearance mode segmented control
  segment: { flexDirection: 'row' },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
  },
  segIcon: { fontSize: 14 },
  segLabel: { fontSize: 13, fontWeight: '600' },

  // Color dots
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  rowLabel: { fontSize: 15, fontWeight: '500' },

  // Gradient presets
  presetsRow: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  presetSwatch: { width: 44, height: 66, borderRadius: 8, overflow: 'hidden' },
  presetCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Color pick sections (vertical layout: label row + scrollable dots)
  colorPickSection: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  colorPickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDotsRow: { gap: 8, alignItems: 'center' },
  iconBox: { width: 26, height: 26, borderRadius: 13 },
  miniDot: { width: 26, height: 26, borderRadius: 13 },

  // Preview section
  previewSection: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  randomizeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  randomizeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
