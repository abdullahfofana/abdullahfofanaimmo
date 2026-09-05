/**
 * ImmoCI Mobile Icon Design System Tokens
 * ─────────────────────────────────────────────────────────────────────────────
 * Strict icon sizing and stroke-width rules across the mobile application.
 * All icons must use Lucide React Native for 100% visual consistency.
 */

export const IconSizes = {
  /** Bottom navigation tabs, top navigation header icons */
  nav: 20,
  /** Navigation icons with higher emphasis (e.g. back chevron) */
  navLg: 22,
  /** Primary & Secondary CTA button icons */
  action: 18,
  /** Small action icons (inline buttons, card actions) */
  actionSm: 15,
  /** Property specs, list items, features (Bed, Bath, Maximize2) */
  spec: 14,
  /** Form inputs, search fields */
  input: 18,
  /** Small supporting badge icons, status checkmarks, mini chips */
  chip: 11,
  /** Medium badge icons */
  badge: 12,
  /** Empty state illustrations, large onboarding heroes */
  empty: 40,
  /** Extra large empty states */
  emptyLg: 48,
} as const;

export const IconStrokes = {
  /** Regular stroke width for unfocused or secondary icons */
  regular: 2.0,
  /** Medium-bold stroke width for active / focused navigation and CTAs */
  medium: 2.2,
  /** Bold stroke width for micro badges, checkmarks, and emphasis */
  bold: 2.6,
  /** Light stroke width for large empty-state icons to prevent visual heaviness */
  light: 1.5,
} as const;

export default {
  sizes: IconSizes,
  strokes: IconStrokes,
};
