/**
 * Forge — Design Token Definitions
 *
 * All colors are expressed in HSL so the palette is harmonious and
 * easy to adjust (shifting one hue value moves the whole scale).
 *
 * Hue anchors:
 *   Neutrals  → 220–222  (cool blue-gray — feels premium, not flat)
 *   Primary   → 346      (coral pink — the brand)
 *   Success   → 142      (green)
 *   Warning   →  38      (amber)
 *   Error     →   4      (red)
 *
 * Import ColorTokens and the token objects; never use these directly
 * in components — always go through useTheme() from ThemeContext.tsx.
 */

// ─── Token shape ─────────────────────────────────────────────────────────────

export type ColorTokens = {
  // Backgrounds — layered from darkest (background) to lightest (surfaceRaised)
  background: string;      // screen / page fill
  surface: string;         // cards, sheets, modals
  surfaceRaised: string;   // chips, tags, input fields, pill nav

  // Separators
  border: string;          // card outlines, dividers

  // Text — four semantic levels
  textPrimary: string;     // headings, body copy
  textSecondary: string;   // captions, labels, hints
  textDisabled: string;    // placeholder / disabled state
  textInverse: string;     // text on primary-colored backgrounds

  // Brand action color (coral pink)
  primary: string;         // CTA buttons, active tab capsule, key accents
  primaryMuted: string;    // tinted card highlights, subtle selection bg

  // Semantic states
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  error: string;
  errorMuted: string;
};

// ─── Light theme ─────────────────────────────────────────────────────────────
// Strategy: very-light-gray background + pure-white cards = clear depth hierarchy.
// Text is near-black with a cool blue tint (feels richer than pure #000).

export const lightTokens: ColorTokens = {
  // Backgrounds
  background:    'hsl(220, 20%, 97%)',   // #F2F4F8  very light page backdrop
  surface:       'hsl(  0,  0%,100%)',   // #FFFFFF  cards pop from background
  surfaceRaised: 'hsl(220, 16%, 94%)',   // #ECEFF5  chips, tags, inputs

  // Borders
  border:        'hsl(220, 13%, 91%)',   // #E2E5EE  subtle, not harsh

  // Text
  textPrimary:   'hsl(220, 20%, 12%)',   // #1B1E2B  near-black, cool cast
  textSecondary: 'hsl(220,  9%, 50%)',   // #76808C  comfortable mid-gray
  textDisabled:  'hsl(220,  9%, 73%)',   // #B1B6BF  light — placeholders
  textInverse:   'hsl(  0,  0%,100%)',   // #FFFFFF  on coral buttons

  // Brand
  primary:       'hsl(346, 82%, 64%)',   // #F05C7F  coral pink
  primaryMuted:  'hsl(346, 90%, 95%)',   // #FDEEF2  pink tint backgrounds

  // Semantic
  success:       'hsl(142, 65%, 40%)',   // #23A85C  rich, readable green
  successMuted:  'hsl(142, 55%, 93%)',   // #E3F8EE  mint tint

  warning:       'hsl( 38, 90%, 50%)',   // #F59500  clean amber
  warningMuted:  'hsl( 38, 90%, 94%)',   // #FEF4E0  light amber tint

  error:         'hsl(  4, 78%, 57%)',   // #E83726  classic red
  errorMuted:    'hsl(  4, 78%, 95%)',   // #FDEBE8  light red tint
};

// ─── Dark theme ──────────────────────────────────────────────────────────────
// Strategy: not pure black (too harsh) — deep blue-black with subtle layers.
// Surface sits 5 L-points above background; surfaceRaised another 5 above that.
// Text is soft white so it doesn't glare. Primary stays vibrant (slightly lighter).

export const darkTokens: ColorTokens = {
  // Backgrounds — three steps of elevation via lightness
  background:    'hsl(222, 22%,  9%)',   // #131825  rich near-black
  surface:       'hsl(222, 20%, 14%)',   // #1D2336  card surfaces
  surfaceRaised: 'hsl(222, 18%, 19%)',   // #272F43  chips, inputs, pill nav

  // Borders
  border:        'hsl(222, 16%, 24%)',   // #303D54  visible, quiet

  // Text
  textPrimary:   'hsl(220, 15%, 92%)',   // #E5E8EF  soft white, not blinding
  textSecondary: 'hsl(220,  9%, 56%)',   // #848D9A  comfortably muted
  textDisabled:  'hsl(220,  9%, 36%)',   // #535A67  very muted
  textInverse:   'hsl(  0,  0%,100%)',   // #FFFFFF  on coral buttons

  // Brand — slightly lighter so it stays vibrant against dark bg
  primary:       'hsl(346, 82%, 66%)',   // #F26882  coral pink (one step up)
  primaryMuted:  'hsl(346, 45%, 20%)',   // #3E1928  dark pink tint

  // Semantic — all shifted brighter so they read on dark surfaces
  success:       'hsl(142, 60%, 48%)',   // #31C26B  brighter green
  successMuted:  'hsl(142, 35%, 15%)',   // #162B1F  dark mint tint

  warning:       'hsl( 38, 88%, 57%)',   // #F5A92E  brighter amber
  warningMuted:  'hsl( 38, 60%, 16%)',   // #3A2A0E  dark amber tint

  error:         'hsl(  4, 76%, 62%)',   // #E84D3E  brighter red
  errorMuted:    'hsl(  4, 50%, 17%)',   // #3D1915  dark red tint
};
