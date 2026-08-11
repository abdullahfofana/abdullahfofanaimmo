/**
 * ImmoCI Spacing Scale v2
 * Base unit: 4px. All values are multiples of 4.
 * ─────────────────────────────────────────────
 * xs        4   — icon gaps, tight internal spacing
 * sm        8   — compact padding, small gaps
 * md        12  — standard element padding
 * lg        16  — card internal padding (compact)
 * xl        24  — card internal padding (standard)
 * xxl       32  — section internal padding
 * xxxl      48  — section vertical spacing
 * section   56  — major section gap (between page sections)
 * pageGutter 20 — mobile edge margin
 */
const Spacing = {
  xs:          4,
  sm:          8,
  md:          12,
  lg:          16,
  xl:          24,
  xxl:         32,
  xxxl:        48,
  section:     56,
  pageGutter:  20,
} as const;

export default Spacing;
