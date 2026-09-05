/**
 * ImmoCI Mobile Typography Scale
 * ─────────────────────────────────────────────────────────────────────────────
 * Strict mobile-first typography hierarchy designed for 375pt–430pt displays.
 * Follows Apple HIG & Material 3 typography guidelines.
 */

const Typography = {
  // ── Display Hero (Screen-level hero banners only) ─────────────────────────
  display: {
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 34,
    letterSpacing: -0.8,
  },

  // ── Headings ─────────────────────────────────────────────────────────────
  h1: {
    fontSize: 22,
    fontWeight: '800' as const,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  h4: {
    fontSize: 13.5,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: 0,
  },

  // ── Body ─────────────────────────────────────────────────────────────────
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 21,
  },
  bodySmall: {
    fontSize: 12.5,
    fontWeight: '400' as const,
    lineHeight: 17,
  },

  // ── Price Callouts ───────────────────────────────────────────────────────
  price: {
    fontSize: 20,
    fontWeight: '800' as const,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  priceSmall: {
    fontSize: 16,
    fontWeight: '800' as const,
    lineHeight: 20,
    letterSpacing: -0.2,
  },

  // ── Eyebrow / Micro-tags (All Caps, Spaced) ──────────────────────────────
  eyebrow: {
    fontSize: 10,
    fontWeight: '800' as const,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  eyebrowLg: {
    fontSize: 11.5,
    fontWeight: '800' as const,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },

  // ── Caption / Meta ───────────────────────────────────────────────────────
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 15,
    letterSpacing: 0.2,
  },

  // ── Button Text ──────────────────────────────────────────────────────────
  button: {
    fontSize: 14.5,
    fontWeight: '700' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  buttonSm: {
    fontSize: 12.5,
    fontWeight: '600' as const,
    lineHeight: 17,
    letterSpacing: 0,
  },
};

export default Typography;
