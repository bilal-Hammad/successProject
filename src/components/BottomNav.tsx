import * as Haptics from 'expo-haptics';
import { usePathname, useRouter } from 'expo-router';
import { useId, useRef, useState } from 'react';
import {
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
// "Forge glass" pattern — see CLAUDE.md's Reusable UI Patterns section.
// Real native Liquid Glass (iOS 26+) via @expo/ui/swift-ui, confirmed working
// inline in a normal screen (not just a widget layout) in this project.
import {
  Host,
  GlassEffectContainer,
  Capsule,
  Namespace,
  HStack,
  ZStack,
  RNHostView,
} from '@expo/ui/swift-ui';
import { glassEffect, glassEffectId, frame, opacity } from '@expo/ui/swift-ui/modifiers';

// Single-touch-owner gesture thresholds (Step 5a). @expo/ui exposes no
// continuous native drag primitive and no gesture-composition/exclusivity
// modifier, so tap vs. drag is disambiguated entirely on the RN side via
// PanResponder — movement-distance only, no timer. DRAG_THRESHOLD arms the
// lens bubble; MOVE_SLOP guards the release tap check.
const DRAG_THRESHOLD = 8;
const MOVE_SLOP = 10;

// ─── Layout constants (keep in sync with useBottomNavHeight) ──────────────────
const PILL_H = 70;
const FLOAT_GAP = 10;
const H_PAD = 16;

const { width: SCREEN_W } = Dimensions.get('window');
const PILL_W = SCREEN_W - H_PAD * 2;
const TAB_W = PILL_W / 3;

// Selected-tab glass capsule — sized to hug the icon (28pt) with modest,
// Apple-proportioned padding, NOT the full TAB_W×PILL_H tap-target slot.
// Padding bumped up (fix-request item 2) to match the visual weight of
// Apple's own Phone app "Keypad" resting-tab capsule reference — the
// previous 14/8 padding read as too cramped once compared side-by-side.
const ICON_SIZE = 28;
// H_PAD widened + V_PAD tightened vs. previous 18/13 to produce a clearly
// horizontal pill (72×46, ratio 1.57) rather than the near-circular 64×54
// that was matching the reference's icon+label width but looked round for
// icon-only slots.
const CAPSULE_H_PAD = 22;
const CAPSULE_V_PAD = 9;
const CAPSULE_W = ICON_SIZE + CAPSULE_H_PAD * 2;
const CAPSULE_H = ICON_SIZE + CAPSULE_V_PAD * 2;

// Press-hold "lens" bubble (Step 5b) — larger than the resting capsule,
// floats free of the tab grid and follows the touch's x position. Bumped up
// alongside the resting capsule above so it still reads as clearly bigger,
// not just equal to it.
const LENS_W = 80;
const LENS_H = 74;

// Transparency/clarity tuning (fix-request item 3) — flip these to A/B test
// on-device: 'regular' + a dark tint reads more defined/opaque against
// arbitrary content behind the bar (closer to how the bar's own background
// gets a dim layer underneath it for definition); 'clear' is Apple's more
// see-through, less-frosted variant. Set LENS_TINT to undefined to compare
// untinted.
const LENS_GLASS_VARIANT: 'regular' | 'clear' = 'clear';
const LENS_TINT: string | undefined = undefined;

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
  const namespaceId = useId();

  // Map current path to an active index
  const activeIndex =
    pathname === '/' ? 0 :
    pathname === '/progress' ? 1 :
    pathname === '/profile' ? 2 : -1;

  // ── Icon colours ────────────────────────────────────────────────────────────
  // All three slots share the same treatment: neutral gray glass pill behind
  // the icon when selected (no accent tint on the pill itself — only the icon
  // is colored). Home used to be special-cased here (solid-filled capsule +
  // white icon) as a leftover from the old Home/Add toggle — removed for
  // consistency, confirmed via real-device test.
  // Bar renders as light glass (clear variant over light app content) so
  // unselected icons must be dark for contrast — matches the reference's
  // solid black icons on white bar. White icons at any opacity read as
  // invisible or washed-out against a light background.
  const DIM = 'rgba(0,0,0,0.6)';
  const slot0Color = activeIndex === 0 ? theme.colors.primary : DIM;
  const slot1Color = activeIndex === 1 ? theme.colors.primary : DIM;
  const slot2Color = activeIndex === 2 ? theme.colors.primary : DIM;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const PATHS = ['/', '/progress', '/profile'] as const;

  const pressSlot = (path: (typeof PATHS)[number]) => {
    if (PATHS.indexOf(path) === activeIndex) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.navigate(path);
  };

  // lensPos: x-center of the bubble in bar-local coordinates. Set in
  // onPanResponderGrant so the Host is pre-positioned before it becomes
  // visible — prevents the startup-position glitch where lensX was null
  // on the first render and the Host briefly appeared at the center fallback.
  // lensVisible: true only after the drag threshold is crossed. Decoupled
  // from lensPos so opacity can flip independently of position.
  const [lensPos, setLensPos] = useState(PILL_W / 2);
  const [lensVisible, setLensVisible] = useState(false);
  // gestureActive gates the Host mount/unmount — see original comment above.
  const [gestureActive, setGestureActive] = useState(false);

  // Per-tab modifiers: selected slot gets a neutral (untinted) glass capsule,
  // grouped for morphing via glassEffectId + Namespace. Unselected slots get
  // no glass effect at all. No animation/morph wiring yet — selection just
  // switches instantly; smooth morph between slots is the next step.
  //
  // Modifiers apply in array order (each wraps the previous result, same as
  // chained SwiftUI modifiers): the capsule-sized frame comes first so
  // glassEffect fills a tight icon-hugging box, then a second, larger frame
  // re-centers that small glass shape inside the full TAB_W×PILL_H tap
  // target — visual capsule size and tappable area are intentionally
  // decoupled, matching Apple's own hit-target-vs-visual-size pattern.
  // No onTapGesture here — Step 5 moves all touch handling (tap AND
  // press-hold-drag) to the single PanResponder overlay below.
  const tabModifiers = (index: number) => [
    frame({ width: CAPSULE_W, height: CAPSULE_H }),
    ...(activeIndex === index && !lensVisible
      ? [
          // 'regular' frosted material renders as a neutral gray on light
          // backgrounds — matches the reference's barely-visible soft gray
          // capsule. 'clear' produced stark white specular highlights that
          // read as an oversized white circle rather than a subtle indicator.
          glassEffect({ glass: { variant: 'regular' as const }, shape: 'capsule' as const }),
          glassEffectId('selected-tab', namespaceId),
        ]
      : []),
    frame({ width: TAB_W, height: PILL_H }),
  ];

  // ── Step 5a: unified tap / press-hold-drag recognition ─────────────────────
  // Refs (not state) so the PanResponder — created once — always reads the
  // latest activeIndex/pressSlot without recreating handlers every render.
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const pressSlotRef = useRef(pressSlot);
  pressSlotRef.current = pressSlot;
  const isRTLRef = useRef(isRTL);
  isRTLRef.current = isRTL;

  // Physical x position (0..PILL_W, left edge of the overlay) -> logical tab
  // index. In RTL the native Host mirrors its content (layoutDirection prop),
  // so logical slot 0 (Home) renders on the physical right — mirror here too.
  const zoneFromX = (x: number) => {
    const physicalZone = Math.min(2, Math.max(0, Math.floor(x / TAB_W)));
    return isRTLRef.current ? 2 - physicalZone : physicalZone;
  };

  // Fix (on-device report): nativeEvent.locationX is unreliable here — it
  // was reading anchored to the wrong tab and the rightmost tab wasn't
  // registering touches at all, consistent with locationX being computed
  // relative to the wrong reference frame in this Fabric + native-Host
  // composition. pageX (screen-absolute) + a measured, known-good origin for
  // this exact overlay view is the robust alternative.
  const overlayRef = useRef<View>(null);
  // Initialized to H_PAD — the statically-known screen-x of the bar's left
  // edge (wrapper is left:0, paddingHorizontal:H_PAD, so shadow/pill/overlay
  // all start at H_PAD). measureInWindow in onLayout will refine this, but
  // the correct initial value means drags before the first layout event still
  // position the bubble correctly.
  const barOriginXRef = useRef(H_PAD);
  const touchXFromEvent = (evt: { nativeEvent: { pageX: number } }) =>
    evt.nativeEvent.pageX - barOriginXRef.current;

  const gestureRef = useRef<{
    startZone: number;
    isDragging: boolean;
  } | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // Set lensPos here — same batch as setGestureActive — so the Host
        // mounts in one commit already at the correct x. No fallback-position
        // frame, no startup jump.
        const touchX = Math.min(PILL_W, Math.max(0, touchXFromEvent(evt)));
        gestureRef.current = {
          startZone: zoneFromX(touchX),
          isDragging: false,
        };
        setLensPos(touchX);
        setGestureActive(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        const g = gestureRef.current;
        if (!g) return;
        // Always track position — even pre-threshold — so when visibility
        // flips on, the bubble is already exactly under the finger.
        const clampedX = Math.min(PILL_W, Math.max(0, touchXFromEvent(evt)));
        setLensPos(clampedX);
        if (g.isDragging) return;
        const moved = Math.hypot(gestureState.dx, gestureState.dy);
        if (moved >= DRAG_THRESHOLD) {
          g.isDragging = true;
          setLensVisible(true);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const g = gestureRef.current;
        gestureRef.current = null;
        setGestureActive(false);
        setLensVisible(false);
        setLensPos(PILL_W / 2);
        if (!g) return;
        if (g.isDragging) {
          // Step 5c: navigate to the release zone if it differs from the
          // current tab. pressSlot already no-ops on the current tab, but
          // the explicit guard avoids the haptic on a same-tab release.
          const releaseZone = zoneFromX(touchXFromEvent(evt));
          if (releaseZone !== activeIndexRef.current) {
            pressSlotRef.current(PATHS[releaseZone]);
          }
          return;
        }
        const moved = Math.hypot(gestureState.dx, gestureState.dy);
        if (moved < MOVE_SLOP) {
          pressSlotRef.current(PATHS[g.startZone]);
        }
      },
      onPanResponderTerminate: () => {
        gestureRef.current = null;
        setGestureActive(false);
        setLensVisible(false);
        setLensPos(PILL_W / 2);
      },
    })
  ).current;

  return (
    <View style={[s.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={s.shadow}>
        <View style={s.pill}>

          {/* STEP 2: the bar's own background material — real native Liquid
              Glass (iOS 26+) replacing the old BlurView. Falls back to a flat
              tinted view on Android/older iOS, same as before.
              pointerEvents="none" (fix): this native Host was silently
              swallowing touches at the UIKit level despite having no RN
              touch handlers of its own — the likely root cause of the
              mispositioned lens bubble and the dead rightmost tab. */}
          {Platform.OS === 'ios' ? (
            <Host style={StyleSheet.absoluteFill} pointerEvents="none">
              <GlassEffectContainer>
                <Capsule modifiers={[glassEffect({ glass: { variant: 'clear' }, shape: 'capsule' })]} />
              </GlassEffectContainer>
            </Host>
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(18,18,24,0.94)' }]} />
          )}

          {/* STEP 3: per-tab selected capsule + icons — real glassEffect +
              glassEffectId/Namespace composition. Existing SVG icon components
              embedded unchanged via RNHostView. Purely visual now — no gesture
              modifiers here; the PanResponder overlay below owns all touch.
              pointerEvents="none" (fix): same native touch-swallowing issue
              as the Step 2 Host above. */}
          {Platform.OS === 'ios' ? (
            <Host
              style={StyleSheet.absoluteFill}
              layoutDirection={isRTL ? 'rightToLeft' : 'leftToRight'}
              pointerEvents="none"
            >
              <Namespace id={namespaceId}>
                <GlassEffectContainer>
                  <HStack spacing={0}>
                    <ZStack modifiers={tabModifiers(0)}>
                      <RNHostView>
                        <IconHome color={slot0Color} size={28} />
                      </RNHostView>
                    </ZStack>
                    <ZStack modifiers={tabModifiers(1)}>
                      <RNHostView>
                        <IconChart color={slot1Color} size={28} />
                      </RNHostView>
                    </ZStack>
                    <ZStack modifiers={tabModifiers(2)}>
                      <RNHostView>
                        <IconPerson color={slot2Color} size={28} />
                      </RNHostView>
                    </ZStack>
                  </HStack>
                </GlassEffectContainer>
              </Namespace>
            </Host>
          ) : (
            <View style={[StyleSheet.absoluteFill, s.row]}>
              <Pressable style={s.tab} onPress={() => pressSlot('/')}>
                <IconHome color={slot0Color} size={28} />
              </Pressable>
              <Pressable style={s.tab} onPress={() => pressSlot('/progress')}>
                <IconChart color={slot1Color} size={28} />
              </Pressable>
              <Pressable style={s.tab} onPress={() => pressSlot('/profile')}>
                <IconPerson color={slot2Color} size={28} />
              </Pressable>
            </View>
          )}

          {/* STEP 5a: single touch owner for the native (iOS) composition —
              recognizes quick tap vs. press-hold-drag itself; the Step 3
              ZStacks above carry no gesture modifiers of their own. Android
              fallback above already handles its own taps via Pressable.
              onLayout re-measures barOriginXRef (used by touchXFromEvent)
              whenever this view's position/size changes, e.g. rotation. */}
          {Platform.OS === 'ios' && (
            <View
              ref={overlayRef}
              style={StyleSheet.absoluteFill}
              onLayout={() => {
                // requestAnimationFrame defers measureInWindow by one frame so
                // the view is fully composited before we read its screen position.
                // Calling it synchronously inside onLayout can return 0 on the
                // first render because the native commit hasn't happened yet.
                requestAnimationFrame(() => {
                  overlayRef.current?.measureInWindow((x) => {
                    console.log('[BottomNav] bar origin x:', x, '(expected ~' + H_PAD + ')');
                    barOriginXRef.current = x;
                  });
                });
              }}
              {...panResponder.panHandlers}
            />
          )}

        </View>

        {/* STEP 5b: floating "lens" bubble — deliberately a sibling of the
            clipped `pill` View above (not a child of it), so it can visually
            extend past the bar's rounded edges while dragging instead of
            being cut off by `pill`'s overflow:hidden. Position is computed
            with an explicit topLeading-anchored ZStack + offset rather than
            relying on the Host's default child placement, which isn't
            documented and would otherwise make the follow-the-finger math
            unpredictable. pointerEvents="none" so it never steals touches
            from the PanResponder overlay inside `pill`.

            Mounted for the duration of any touch (gestureActive, set from
            onPanResponderGrant to release/terminate) rather than permanently
            or only once armed — see the gestureActive comment above for why:
            this avoids both the cold-mount delay (it gets the full hold
            threshold to warm up before becoming visible) and the "stuck
            visible" risk of relying on an opacity transition to hide it. */}
        {/* Lens bubble: the Host itself is sized LENS_W×LENS_H and positioned
            by RN layout — left = touch-x − LENS_W/2 centers it on the finger.
            Previously used a full-size absoluteFill Host + SwiftUI ZStack +
            offset(), but that ZStack was NOT filling the Host frame — SwiftUI
            sized it to fit its content (80×74) then centered that in the Host
            (PILL_W×PILL_H), so the "topLeading" origin was at (139, -2) rather
            than (0, 0). Every offset() call was off by +139pt, confirmed by
            device logs. Letting RN own the positioning eliminates the SwiftUI
            coordinate-space ambiguity entirely. */}
        {Platform.OS === 'ios' && gestureActive && (
          <Host
            style={{
              position: 'absolute',
              left: lensPos - LENS_W / 2,
              top: (PILL_H - LENS_H) / 2,
              width: LENS_W,
              height: LENS_H,
            }}
            pointerEvents="none"
          >
            <GlassEffectContainer>
              <Capsule
                modifiers={[
                  glassEffect({ glass: { variant: LENS_GLASS_VARIANT, tint: LENS_TINT }, shape: 'capsule' }),
                  opacity(lensVisible ? 1 : 0),
                ]}
              />
            </GlassEffectContainer>
          </Host>
        )}
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },

  // Inner pill — clips background to rounded shape
  pill: {
    height: PILL_H,
    borderRadius: 50,
    flexDirection: 'row',
    overflow: 'hidden',
  },

  // Android/older-iOS fallback row (no native glass, no RNHostView)
  row: {
    flexDirection: 'row',
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
