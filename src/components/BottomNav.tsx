import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';

// ─── Layout constants (keep in sync with useBottomNavHeight) ──────────────────
const ACCENT = '#F05A7E';
const PILL_H = 64;
const FLOAT_GAP = 10;
const H_PAD = 20;

const { width: SCREEN_W } = Dimensions.get('window');
const PILL_W = SCREEN_W - H_PAD * 2;
const TAB_W = PILL_W / 3;

// Sliding highlight capsule
const HL_V_INSET = 6;
const HL_H_INSET = 5;
const HL_W = TAB_W - HL_H_INSET * 2;
const HL_H = PILL_H - HL_V_INSET * 2;

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconHome({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3L21 10.5V21H15V15H9V21H3V10.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconPlus({ color = '#fff', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 5V19" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M5 12H19" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function IconChart({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="12" width="4" height="9" rx="1.5" fill={color} />
      <Rect x="10" y="7" width="4" height="14" rx="1.5" fill={color} />
      <Rect x="17" y="3" width="4" height="18" rx="1.5" fill={color} />
    </Svg>
  );
}

function IconPerson({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={1.8} />
      <Path
        d="M4 21C4 16.582 7.582 14 12 14C16.418 14 20 16.582 20 21"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
// Self-contained: uses expo-router hooks instead of React Navigation props,
// rendered as a root-level absolute overlay (not inside the Tab navigator layout).
export function BottomNav() {
  const { t } = useLanguage();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  // Map current path to an active index
  const activeIndex =
    pathname === '/' ? 0 :
    pathname === '/progress' ? 1 :
    pathname === '/profile' ? 2 : -1;
  const isOnToday = pathname === '/';

  // ── Animations ──────────────────────────────────────────────────────────────

  // Sliding dark highlight (for slots 1 & 2 when active)
  const hlX = useRef(
    new Animated.Value(Math.max(activeIndex, 0) * TAB_W + HL_H_INSET)
  ).current;
  const hlOpacity = useRef(
    new Animated.Value(activeIndex > 0 ? 1 : 0)
  ).current;

  // Morph: 0 = home icon visible, 1 = plus icon visible
  const morphAnim = useRef(new Animated.Value(isOnToday ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(hlX, {
        toValue: Math.max(activeIndex, 0) * TAB_W + HL_H_INSET,
        useNativeDriver: false,
        damping: 20,
        stiffness: 260,
        mass: 0.7,
      }),
      Animated.timing(hlOpacity, {
        toValue: activeIndex > 0 ? 1 : 0,
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.timing(morphAnim, {
        toValue: isOnToday ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex, isOnToday]);

  // Derived morph values
  const homeOpacity = morphAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 0, 0] });
  const plusOpacity = morphAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] });
  const homeScale  = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] });
  const plusScale  = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  // Slot-0 label fades away when showing +
  const slot0LabelOpacity = morphAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });

  // ── Icon / label colours ────────────────────────────────────────────────────
  // Slot 0 always sits on the pink background → always white
  const DIM = 'rgba(255,255,255,0.55)';
  const slot1Color = activeIndex === 1 ? ACCENT : DIM;
  const slot2Color = activeIndex === 2 ? ACCENT : DIM;
  const slot1LabelColor = activeIndex === 1 ? ACCENT : DIM;
  const slot2LabelColor = activeIndex === 2 ? ACCENT : DIM;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const PATHS = ['/', '/progress', '/profile'] as const;

  const pressSlot = (path: (typeof PATHS)[number]) => {
    if (PATHS.indexOf(path) === activeIndex) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.navigate(path);
  };

  const pressFirst = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isOnToday) {
      router.push('/templates');
    } else {
      router.navigate('/');
    }
  };

  return (
    // Absolutely positioned — floats over ALL screen content, clears safe area below pill
    <View style={[s.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Shadow ring — separate from overflow:hidden pill so shadow renders */}
      <View style={s.shadow}>

        {/* Pill: overflow:hidden so BlurView is clipped to rounded shape */}
        <View style={s.pill}>

          {/* ── Glass background ─────────────────────────────── */}
          {Platform.OS === 'ios' ? (
            <BlurView tint="systemChromeMaterialDark" intensity={75} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(18,18,24,0.94)' }]} />
          )}

          {/* Dark color wash on top of blur so pill reads as dark on both platforms */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,10,16,0.45)' }]} />

          {/* ── Permanent pink capsule under slot 0 ──────────── */}
          <View
            pointerEvents="none"
            style={[s.highlight, { left: HL_H_INSET, backgroundColor: ACCENT }]}
          />

          {/* ── Sliding dark capsule for slots 1 & 2 ─────────── */}
          <Animated.View
            pointerEvents="none"
            style={[
              s.highlight,
              {
                left: hlX,
                backgroundColor: 'rgba(255,255,255,0.13)',
                opacity: hlOpacity,
              },
            ]}
          />

          {/* ── Slot 0: Today / Add ──────────────────────────── */}
          <Pressable style={s.tab} onPress={pressFirst}>
            {/* Morphing icon pair */}
            <View style={s.iconWrap}>
              <Animated.View
                style={[s.iconLayer, { opacity: homeOpacity, transform: [{ scale: homeScale }] }]}
              >
                <IconHome color="#fff" size={21} />
              </Animated.View>
              <Animated.View
                style={[s.iconLayer, { opacity: plusOpacity, transform: [{ scale: plusScale }] }]}
              >
                <IconPlus color="#fff" size={24} />
              </Animated.View>
            </View>
            <Animated.Text style={[s.label, { color: '#fff', opacity: slot0LabelOpacity }]}>
              {t('tabs.today')}
            </Animated.Text>
          </Pressable>

          {/* ── Slot 1: Progress ─────────────────────────────── */}
          <Pressable style={s.tab} onPress={() => pressSlot('/progress')}>
            <IconChart color={slot1Color} size={22} />
            <Text style={[s.label, { color: slot1LabelColor }]}>{t('tabs.progress')}</Text>
          </Pressable>

          {/* ── Slot 2: Profile ──────────────────────────────── */}
          <Pressable style={s.tab} onPress={() => pressSlot('/profile')}>
            <IconPerson color={slot2Color} size={22} />
            <Text style={[s.label, { color: slot2LabelColor }]}>{t('tabs.profile')}</Text>
          </Pressable>

        </View>{/* /pill */}
      </View>{/* /shadow */}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: FLOAT_GAP,
    paddingHorizontal: H_PAD,
    zIndex: 100,
  },

  // Outer ring — holds shadow (must NOT have overflow:hidden or shadow is clipped on iOS)
  shadow: {
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 18,
  },

  // Inner pill — clips BlurView to rounded shape
  pill: {
    height: PILL_H,
    borderRadius: 50,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },

  // Sliding / static capsule highlight
  highlight: {
    position: 'absolute',
    top: HL_V_INSET,
    width: HL_W,
    height: HL_H,
    borderRadius: HL_H / 2,
  },

  // Each of the 3 tab slots
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  // Fixed-size icon container for smooth morph
  iconWrap: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
