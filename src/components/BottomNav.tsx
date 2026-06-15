import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';

// ─── Layout constants (keep in sync with useBottomNavHeight) ──────────────────
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

function IconHome({ color, size = 28 }: { color: string; size?: number }) {
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

function IconPlus({ color = '#fff', size = 30 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 5V19" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M5 12H19" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function IconChart({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="12" width="4" height="9" rx="1.5" fill={color} />
      <Rect x="10" y="7" width="4" height="14" rx="1.5" fill={color} />
      <Rect x="17" y="3" width="4" height="18" rx="1.5" fill={color} />
    </Svg>
  );
}

function IconPerson({ color, size = 28 }: { color: string; size?: number }) {
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
  const { isRTL } = useLanguage();
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

  // In RTL flex layout slot 0 renders on the physical right, so mirror the x position
  const slotLeft = (i: number) =>
    isRTL
      ? (2 - Math.max(i, 0)) * TAB_W + HL_H_INSET
      : Math.max(i, 0) * TAB_W + HL_H_INSET;

  // ── Animations ──────────────────────────────────────────────────────────────

  const hlX = useRef(new Animated.Value(slotLeft(activeIndex))).current;
  const hlOpacity = useRef(
    new Animated.Value(activeIndex > 0 ? 1 : 0)
  ).current;

  // Morph: 0 = home icon visible, 1 = plus icon visible
  const morphAnim = useRef(new Animated.Value(isOnToday ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(hlX, {
        toValue: slotLeft(activeIndex),
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
  }, [activeIndex, isOnToday, isRTL]);

  // Derived morph values
  const homeOpacity = morphAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 0, 0] });
  const plusOpacity = morphAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] });
  const homeScale  = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] });
  const plusScale  = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  // ── Icon colours ────────────────────────────────────────────────────────────
  const DIM = 'rgba(255,255,255,0.55)';
  const slot0Color = activeIndex === 0 ? '#fff' : DIM;
  const slot1Color = activeIndex === 1 ? theme.colors.primary : DIM;
  const slot2Color = activeIndex === 2 ? theme.colors.primary : DIM;

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
    <View style={[s.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={s.shadow}>
        <View style={s.pill}>

          {Platform.OS === 'ios' ? (
            <BlurView tint="systemChromeMaterialDark" intensity={75} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(18,18,24,0.94)' }]} />
          )}

          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,10,16,0.45)' }]} />

          {/* Pink capsule under slot 0 — only when Home is active */}
          {activeIndex === 0 && (
            <View
              pointerEvents="none"
              style={[s.highlight, { left: slotLeft(0), backgroundColor: theme.colors.primary }]}
            />
          )}

          {/* Sliding dark capsule for slots 1 & 2 */}
          <Animated.View
            pointerEvents="none"
            style={[s.highlight, { left: hlX, backgroundColor: 'rgba(255,255,255,0.13)', opacity: hlOpacity }]}
          />

          {/* Slot 0: Home / Add */}
          <Pressable style={s.tab} onPress={pressFirst}>
            <View style={s.iconWrap}>
              <Animated.View style={[s.iconLayer, { opacity: homeOpacity, transform: [{ scale: homeScale }] }]}>
                <IconHome color={slot0Color} size={28} />
              </Animated.View>
              <Animated.View style={[s.iconLayer, { opacity: plusOpacity, transform: [{ scale: plusScale }] }]}>
                <IconPlus color="#fff" size={30} />
              </Animated.View>
            </View>
          </Pressable>

          {/* Slot 1: Progress */}
          <Pressable style={s.tab} onPress={() => pressSlot('/progress')}>
            <IconChart color={slot1Color} size={28} />
          </Pressable>

          {/* Slot 2: Profile */}
          <Pressable style={s.tab} onPress={() => pressSlot('/profile')}>
            <IconPerson color={slot2Color} size={28} />
          </Pressable>

        </View>
      </View>
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

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconWrap: {
    width: 34,
    height: 34,
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
});
