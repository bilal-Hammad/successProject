# Forge – Claude Code Project Guide

## Stack
- **Expo SDK 56** · React Native 0.85.3 · Hermes · **Expo Router** (file-based, typed routes)
- **Zustand** stores (manual AsyncStorage persistence, not `zustand/middleware/persist`)
- Custom i18n: `LanguageContext.tsx` + `translations.ts` → `useLanguage()` → `t(key)`
- Supabase (`@supabase/supabase-js` v2) with AsyncStorage session storage
- `expo-apple-authentication` for Sign in with Apple (iOS only, requires dev build)

## Build & Run

```bash
# Expo Go — ALWAYS use --clear. Plain `npx expo start` serves a stale cached bundle
# and the Reanimated babel plugin will not take effect, crashing DraggableFlatList.
npx expo start --clear

# Development build (required for Apple auth, HealthKit write, any new native module)
npx expo run:ios
```

### iOS build failure recipes

**ReactCodegen "Build input file cannot be found" (rnworklets, rnscreens, rnsvg, safeareacontext)**
Caused by stale `.mm` artifacts from a previous failed codegen run. Fix:
```bash
rm -rf ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/Forge-*
cd ios && pod install
npx expo run:ios
```

**SwiftUICore linker error ("cannot link directly with SwiftUICore")**
Already patched in `ios/Podfile` post_install with `-Wl,-weak_framework,SwiftUICore`.
If Podfile is ever regenerated, re-apply that patch and run `pod install`.

**DraggableFlatList crash: `TypeError: undefined is not a function` at import**
Cause: Metro served a cached bundle that was transformed before `react-native-reanimated/plugin`
was added to `babel.config.js`. Fix: stop the server, run `npx expo start --clear`.
This error will also appear (harmlessly as a warning, not a crash) in a dev build if
the babel plugin is missing — always confirm it is the last entry in `babel.config.js`.

**ExpoAppleAuthentication "Unable to get the view config" warning**
Expected in Expo Go — Apple sign-in requires a dev build. The warning does not crash the app.

## Key Architectural Rules

### Stores
All Zustand stores use a manual `_persist()` pattern (not middleware):
```ts
_persist: async (patch) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(patch));
}
```
Every action calls `_persist()` after mutating state. New stores must follow this same pattern.

### i18n
- Add ALL new keys to all 3 languages (`en`, `ar`, `tr`) in `src/i18n/translations.ts`
- Keys not found return the key string itself — TypeScript won't catch missing keys
- `resolveTitle(id, fallback)` pattern: calls `t('habit.template.' + id)`, falls back to `fallback`
- Section labels use `labelKey` stored in data, resolved at render via `t(section.labelKey)`

### TypeScript / flatMap
`flatMap` on arrays returning mixed union types confuses TypeScript inference. Use explicit `for...of` loops pushing to a typed `result` array instead.

### Expo Router typed routes
New screen files won't appear in `.expo/types/router.d.ts` until the dev server regenerates it. When adding a new route file, manually add it to all three union types in that file to keep `router.push()` fully typed.

### Reanimated
`react-native-reanimated/plugin` **must** be the last entry in `babel.config.js` plugins. Without it, any module importing Reanimated crashes at runtime with `TypeError: undefined is not a function`.

### react-native-draggable-flatlist is REMOVED
`react-native-draggable-flatlist` v4.0.3 is **incompatible with Reanimated 4.x** (Expo SDK 56 ships 4.4.1). It calls internal Reanimated 3 APIs that no longer exist, crashing at import with `TypeError: undefined is not a function` — even with `--clear` and the babel plugin. Do **not** add it back.

`app/edit-templates.tsx` uses ↑/↓ move buttons instead. `react-native-draggable-flatlist` is still listed in `package.json` but is no longer imported anywhere — leave it or remove it from dependencies, but do not import it.

### Native-only features in Expo Go
- `expo-apple-authentication` — warns in Expo Go, requires dev build to actually sign in
- `react-native-health` — Expo Go only; full HealthKit requires dev build

## Removed Features

### Groups — completely removed
There was never a `group`/`groupId` field on the `Habit` model. Groups was a stub UI only. All references (Settings row, `settings-groups.tsx` screen, translation keys `settings.groups` / `form.noGroup`) have been deleted.

### Manual Type picker — replaced by auto-inference
`HabitType` (`'good' | 'bad' | 'track' | 'todo'`) is now inferred from the category instead of being manually chosen:
```ts
function categoryToHabitType(category: string): HabitType {
  if (category === 'bad') return 'bad';
  if (category === 'todo') return 'todo';
  if (category === 'health') return 'track';
  return 'good';
}
```
The type picker UI (4-button row) has been removed from `edit-section/[id].tsx` and `app/habit/new.tsx`. Every caller now passes `habitType` via params. The standalone "+ New" button in `habits.tsx` defaults to `'good'`. Translation key `editSection.habitType` has been removed.

## Reusable UI Patterns

### "Forge animation" — native large-title header + iOS 26 scroll-edge effect

Reproduces Apple's own native large-title-to-small-title navigation bar behavior
(Settings, Mail, Messages), including the iOS 26 "Liquid Glass" scroll-edge blur.
Any future request of the form "do the Forge animation on screen X" means: apply
this exact configuration to that screen.

**This is achieved with 100% true native fidelity — not a JS/Reanimated
approximation.** Confirmed by reading this project's actual installed
dependencies, not assumed:
- `headerLargeTitleEnabled` (+ `headerLargeStyle`, `headerLargeTitleStyle`,
  `headerLargeTitleShadowVisible`) are real options on `expo-router`'s
  `Stack.Screen`, which is backed by `react-native-screens`' native-stack —
  i.e. the actual `UINavigationBar` large-title API, not a custom header
  component. Title collapse/expand is driven directly by the native scroll
  offset (1:1 during manual drag; a native low-bounce spring only for
  programmatic transitions like tap-to-scroll-to-top) because it *is* the OS
  doing it, and it's Dynamic-Type-aware for the same reason.
- `scrollEdgeEffects: { top: 'soft' }` is a real `Stack.Screen` option that
  maps directly to Apple's actual iOS 26 `UIScrollEdgeEffect` API (confirmed
  in `react-native-screens`' native enum `RNSScrollEdgeEffect` —
  `automatic`/`hard`/`soft`/`hidden`, matching `UIScrollEdgeEffect`'s own
  `style` values exactly). `'soft'` is the progressive, diffused, fade-to-clear
  edge treatment (vs. `'hard'`'s sharp dividing line) — this is the spec's
  required style.
- Do **not** also set `headerBlurEffect` alongside `scrollEdgeEffects` —
  react-native-screens' own docs warn the two can overlap/conflict.

**iOS version caveat**: `scrollEdgeEffects` is iOS 26+ only (degrades
gracefully to nothing extra on older iOS — you still get the classic native
large-title blur-on-scroll that's existed since iOS 11, just not the new
soft-gradient treatment). `headerLargeTitleEnabled` itself works back to iOS
11, well within this project's iOS 16.4 deployment target.

**Requirements for a screen to use this pattern:**
1. The screen's root scrollable content must be a `ScrollView` or `FlatList`
   with `contentInsetAdjustmentBehavior="automatic"` set.
2. The screen must be a `Stack.Screen` (native-stack) — **not** a `Tabs.Screen`.
   Expo Router's `Tabs` is built on a JS-rendered bottom-tabs fork
   (`react-navigation/bottom-tabs`-style), which has no large-title support at
   all (that's fundamentally a `UINavigationBar`/native-stack feature). A tab
   screen that wants this pattern needs its own nested single-screen `Stack`
   (e.g. `app/(tabs)/profile/_layout.tsx` wrapping `app/(tabs)/profile/index.tsx`).
3. Any existing custom/static header component on the screen (a hand-rolled
   title `View`, `ScreenHeader`, etc.) must be removed — it would otherwise
   render underneath or alongside the real native header, not collapse with
   it. Header-right buttons move to the native `headerRight` option.
4. Native large titles have no subtitle slot — if the screen's old custom
   header had a subtitle line, decide per-screen whether to drop it or move
   it into the scrolled content as a first row.

**Shared implementation**: `src/theme/forgeAnimationHeaderOptions.ts` exports
`forgeAnimationHeaderOptions(theme)`, returning the standard options fragment
(`headerLargeTitleEnabled`, `headerLargeStyle`, `headerLargeTitleStyle`,
`scrollEdgeEffects`) to spread into any `Stack.Screen options`. There's
deliberately no wrapper *component* — native-stack headers are configured via
options, not children, so a shared options function is the correct level of
reuse.

## Project Structure

```
app/                        Expo Router screens
  (tabs)/                   Tab bar screens
  edit-templates.tsx        Section reorder/hide/create (↑/↓ buttons)
  edit-section/[id].tsx     Custom section habit editor
  habit/[id].tsx            Habit editor
  templates.tsx             Browse templates

src/
  store/
    useHabitStore.ts        Habit CRUD + AsyncStorage
    useSettingsStore.ts     App settings
    useMoodStore.ts         Mood log
    useTemplateSectionStore.ts  Section order/visibility/custom sections
    useAuthStore.ts         Supabase session + Apple sign-in
  services/
    supabaseClient.ts       Supabase client (AsyncStorage session, AppState refresh)
    templateSectionSync.ts  Login sync + debounced push-to-remote
    HealthKitService.ts
  i18n/
    translations.ts         en / ar / tr strings
    LanguageContext.tsx
  templates/                Seed data for built-in sections
  theme/ThemeContext.tsx

supabase/
  schema.sql                Run once in Supabase SQL Editor to create all tables
```

## Supabase Tables
| Table | Purpose |
|---|---|
| `user_template_settings` | Per-user section order + hidden IDs per category |
| `custom_sections` | User-created sections (ID = client `cs_xxx` string) |
| `shared_sections` | Sections shared via `forge://section/<code>` deep link (not yet implemented — no route handler exists for this yet) |
| `official_sections` | Curated sections managed by admins in Supabase UI |

RLS is enabled on all tables. Credentials live in `.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).

## Sync Flow
1. App starts → `useAuthStore._initListener()` restores session from AsyncStorage
2. Session found → `syncOnLogin(userId)`: pulls remote, merges into local (remote wins per category), or pushes local if remote is empty
3. Any store mutation → 2-second debounced `pushToRemote(userId)`
4. Custom section deleted → immediate Supabase `DELETE` (no debounce)
5. Sign out → stops sync subscription, clears session

## iOS App Info
- Bundle ID: `com.bilalhammad.forge`
- Scheme: `forge` (the old pre-rename `momentum` scheme was removed entirely; any previously-shared `momentum://` links no longer open the app)
- Entitlements: HealthKit + Sign in with Apple (`com.apple.developer.applesignin`)
- Deployment target: iOS 16.4
