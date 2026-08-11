/**
 * ImmoCI Typography Scale v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Scale is based on a 1.250 Major Third ratio.
 *
 * Two register axes:
 *   DISPLAY / EDITORIAL  — large serif-weight numerics (hero, price callouts)
 *   UI / FUNCTIONAL      — Inter-style sans for labels, body, captions
 *
 * Golden rule: never use more than 3 sizes on a single screen.
 */

const Typography = {
  // ── Display — hero headline, landing page only ──────────────────────────
  display: {
    fontSize: 52,
    fontWeight: '800' as const,
    lineHeight: 58,
    letterSpacing: -1.5,
  },

  // ── Headings ─────────────────────────────────────────────────────────────
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.1,
  },

  // ── Body ─────────────────────────────────────────────────────────────────
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 23,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 23,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 19,
  },

  // ── Price — accent display for property pricing ───────────────────────────
  price: {
    fontSize: 22,
    fontWeight: '800' as const,
    lineHeight: 26,
    letterSpacing: -0.6,
  },
  priceSmall: {
    fontSize: 17,
    fontWeight: '700' as const,
    lineHeight: 22,
    letterSpacing: -0.3,
  },

  // ── Eyebrow — section labels, category tags (ALL CAPS, spaced) ───────────
  eyebrow: {
    fontSize: 10,
    fontWeight: '700' as const,
    lineHeight: 14,
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
  },
  eyebrowLg: {
    fontSize: 12,
    fontWeight: '700' as const,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },

  // ── Caption / label ───────────────────────────────────────────────────────
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 15,
    letterSpacing: 0.2,
  },

  // ── Button text ───────────────────────────────────────────────────────────
  button: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  buttonSm: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
};

export default Typography;
