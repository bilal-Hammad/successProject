import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import * as SplashScreen from 'expo-splash-screen';

const { height: SCREEN_H } = Dimensions.get('window');

// ── Layout constants tuned to match assets/splash.png ────────────────────────
// SVG viewBox: 0 0 1024 1024. Anvil metal: y=400–730. Glow center: y=512.
// With SVG_SIZE=260, paddingTop = SCREEN_H*0.13 (≈110pt on 844pt iPhone 14):
//   glow center  ≈ 110 + 260*0.50 = 240pt  (≈29% from top)   ← matches static splash
//   Forge top    ≈ anvil-metal-bottom + gap ≈ 330pt  (≈39%)   ← matches static splash
const SVG_SIZE = 260;
const PADDING_TOP = SCREEN_H * 0.13;
// Pull wordmark up so it overlaps the lower glow area, exactly as in the static splash.
// Anvil metal bottom in SVG = SVG_SIZE * 730/1024 ≈ 185pt; empty space below = 75pt.
const TEXT_PULL_UP = 75;

const MIN_HOLD_MS = 300;   // minimum visible time before exit starts
const SAFE_EXIT_MS = 1500; // hard cap — splash ALWAYS hides within 1.5s

interface Props {
  ready: boolean;     // true when app data loaded — triggers exit sequence
  onHidden: () => void;
}

export function AnimatedSplash({ ready, onHidden }: Props) {
  // ── Animated values ──────────────────────────────────────────────────────────
  // Start slightly dim + small: the 28% dip during native→RN handoff is a single
  // frame against identical #161311 background — visually imperceptible.
  const anvilOpacity    = useRef(new Animated.Value(0.72)).current;
  const anvilScale      = useRef(new Animated.Value(0.95)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const exitOpacity     = useRef(new Animated.Value(1)).current;
  // Glow breathing: scale the SVG wrapper ±4%. Solid metal barely shifts;
  // only the soft halo reads as breathing. Pure native driver (transform).
  const glowBreath = useRef(new Animated.Value(1)).current;

  // ── Cross-closure state ──────────────────────────────────────────────────────
  const readyRef    = useRef(ready);
  const canExitRef  = useRef(false);
  const exitDoneRef = useRef(false);
  const breathRef   = useRef<Animated.CompositeAnimation | null>(null);

  // Release pointer events the moment exit starts so the overlay never blocks
  // the app — even if onHidden() is somehow delayed on Hermes production builds.
  const [blocking, setBlocking] = useState(true);

  function triggerExit() {
    if (exitDoneRef.current) return;
    exitDoneRef.current = true;
    breathRef.current?.stop();
    setBlocking(false);
    Animated.timing(exitOpacity, {
      toValue: 0,
      duration: 360,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      // Always call onHidden — even if animation was interrupted (finished=false)
      // so the overlay is never permanently stuck on screen.
      onHidden();
    });
  }

  useEffect(() => {
    readyRef.current = ready;
    if (ready && canExitRef.current) triggerExit();
  }, [ready]);

  useEffect(() => {
    // Hide native splash — AnimatedSplash is already covering it.
    // Background colors match (#161311), so the handoff is seamless.
    SplashScreen.hideAsync().catch(() => {});

    // ── Entrance: opacity bloom + spring scale, wordmark delayed ──────────────
    Animated.parallel([
      Animated.timing(anvilOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(anvilScale, {
        toValue: 1,
        friction: 8,
        tension: 85,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(190),
        Animated.timing(wordmarkOpacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // ── Glow breathing — scale wrapper 1.0 → 1.04 → 0.97, 1.7s per half-cycle ─
    // Starts after entrance settles (~460ms). Sine easing keeps it ultra-subtle.
    const breathTimer = setTimeout(() => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(glowBreath, {
            toValue: 1.04,
            duration: 1700,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowBreath, {
            toValue: 0.97,
            duration: 1700,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      breathRef.current = anim;
      anim.start();
    }, 460);

    // ── Minimum hold, then exit when ready prop arrives ────────────────────────
    const holdTimer = setTimeout(() => {
      canExitRef.current = true;
      if (readyRef.current) triggerExit();
    }, MIN_HOLD_MS);

    // ── Safety: always exit by SAFE_EXIT_MS no matter what ────────────────────
    const safetyTimer = setTimeout(triggerExit, SAFE_EXIT_MS);

    return () => {
      clearTimeout(breathTimer);
      clearTimeout(holdTimer);
      clearTimeout(safetyTimer);
      breathRef.current?.stop();
    };
  }, []);

  return (
    // Outer Animated.View handles exit opacity (native driver, opacity only — no bg).
    // The background lives INSIDE so it fades with everything else and the app
    // content underneath becomes visible when opacity reaches 0.
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity: exitOpacity }]}
      pointerEvents={blocking ? 'auto' : 'none'}
    >
      <View style={[StyleSheet.absoluteFill, styles.bg]}>
        <View style={[styles.content, { paddingTop: PADDING_TOP }]}>

          {/* Anvil: outer = entrance (opacity + spring scale)
                     inner = breathing (±4% scale loop) */}
          <Animated.View
            style={{
              opacity: anvilOpacity,
              transform: [{ scale: anvilScale }],
            }}
          >
            <Animated.View style={{ transform: [{ scale: glowBreath }] }}>
              <Svg
                width={SVG_SIZE}
                height={SVG_SIZE}
                viewBox="0 0 1024 1024"
              >
                <Defs>
                  <RadialGradient
                    id="molten-glow"
                    cx="50%"
                    cy="50%"
                    r="50%"
                    fx="50%"
                    fy="50%"
                  >
                    <Stop offset="0%"   stopColor="#F47A20" stopOpacity={0.45} />
                    <Stop offset="100%" stopColor="#F47A20" stopOpacity={0}    />
                  </RadialGradient>
                </Defs>

                {/* Glow circle — visual breathing comes from wrapper scale above */}
                <Circle cx="512" cy="512" r={400} fill="url(#molten-glow)" />

                {/* Exact anvil paths, copied from /private/tmp/forge-logo.svg */}
                <Path d="M320 400 L704 400 L730 440 V500 H294 V440 L320 400 Z" fill="#F47A20" />
                <Path d="M460 500 H564 L585 680 H439 L460 500 Z"               fill="#F47A20" />
                <Path d="M340 680 H684 V730 H340 V680 Z"                        fill="#F47A20" />
              </Svg>
            </Animated.View>
          </Animated.View>

          {/* Wordmark + tagline — delayed fade-in, pulled up into the glow area */}
          <Animated.View
            style={[styles.textGroup, { opacity: wordmarkOpacity }]}
          >
            <Text style={styles.wordmark}>Forge</Text>
            <Text style={styles.tagline}>START SMALL.{'  '}FINISH STRONG.</Text>
          </Animated.View>

        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: '#161311',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  textGroup: {
    alignItems: 'center',
    marginTop: -TEXT_PULL_UP,
  },
  wordmark: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
});
