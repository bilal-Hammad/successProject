import type { Theme } from './ThemeContext';

/**
 * The "Forge animation" — see CLAUDE.md's "Reusable UI Patterns" section for
 * the full spec and native-fidelity rationale. Spread into any Stack.Screen's
 * `options` to get native large-title-to-small-title collapse plus the iOS 26
 * soft scroll-edge effect. Deliberately not a wrapper component: these are
 * native-stack header options, not renderable children.
 *
 * Explicitly clears headerStyle (an empty object, not just an omitted key).
 * Forcing an opaque custom background defeats the native translucent/blurred
 * material entirely (Apple's own Settings app doesn't set one either) — found
 * the hard way: it read as an opaque scrim instead of frosted glass. Omitting
 * the key isn't enough on its own, either — per-screen `options` replace (not
 * deep-merge) a matching key from the parent navigator's `screenOptions`, so
 * a screen living in a Stack whose screenOptions sets its own opaque
 * headerStyle (as app/_layout.tsx's root Stack does) would otherwise inherit
 * that default the moment this helper stops overriding the key itself — this
 * is exactly what broke Settings the first time this was fixed for
 * Profile/Progress, which don't have that problem since each is its own
 * independent nested Stack with no competing screenOptions at all.
 *
 * @param largeTitleEnabled Pass false to keep the screen in "small" title mode
 * regardless of scroll position. Used for a mount-timing workaround on nested
 * single-screen Stacks — see profile/_layout.tsx and progress/_layout.tsx.
 */
export function forgeAnimationHeaderOptions(theme: Theme, largeTitleEnabled = true) {
  return {
    headerLargeTitleEnabled: largeTitleEnabled,
    headerStyle: {},
    headerLargeTitleStyle: {
      color: theme.colors.textPrimary,
    },
    headerTintColor: theme.colors.textPrimary,
    // Deliberately no headerBlurEffect — react-native-screens warns it can
    // overlap/conflict with scrollEdgeEffects on iOS 26+.
    scrollEdgeEffects: {
      top: 'soft' as const,
    },
  };
}
