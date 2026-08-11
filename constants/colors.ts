/**
 * ImmoCI Design System — Color Tokens v2
 *
 * Philosophy: Editorial restraint. Every color earns its place.
 * —————————————————————————————————————————————————————————————
 * Ink (text):    #18211C  deep near-black with a warm green undertone
 * Canvas:        #F8F5F0  barely-warm ivory — breathing room, not clinical
 * Brand Green:   #1B3A2D  primary CTA, active states, nav indicators
 * Accent Gold:   #C9933A  price labels, trust marks, eyebrow tags — used sparingly
 * Paper:         #FFFFFF  card surfaces
 * Hairline:      #E8E2DA  all borders — single value, warm grey
 *
 * No orange (#FF6B35). No rainbow icon backgrounds. No heavy shadows.
 */

const common = {
  // Brand — Deep Forest Green
  primary:       '#1B3A2D',
  primaryDark:   '#122618',
  primaryLight:  '#2D5A42',
  primaryMid:    '#3D7A58',

  // Accent — Warm Amber/Gold (used sparingly as a premium signal)
  accent:        '#C9933A',
  accentDark:    '#A87328',
  accentLight:   '#E8B86D',
  accentMuted:   '#F5E6C8',

  // Feedback
  error:         '#B91C1C',
  warning:       '#B45309',
  success:       '#166534',
  info:          '#1E40AF',

  // Absolute
  white:         '#FFFFFF',
  black:         '#0A0F0C',

  // Tab icons
  tabIconDefault:  '#8A9E91',
  tabIconSelected: '#1B3A2D',

  // Gradient pairs — used only for the hero image overlay
  gradient: {
    heroOverlay: ['rgba(8,16,10,0.10)', 'rgba(8,16,10,0.78)'] as [string, string],
    greenDark:   ['#1B3A2D', '#0F2218'] as [string, string],
    accentWarm:  ['#C9933A', '#A87328'] as [string, string],
  },
};

// ── Light Mode ──────────────────────────────────────────────────────────────
export const light = {
  ...common,

  // Canvas layers
  background:          '#F8F5F0',   // warm ivory — page background
  backgroundSecondary: '#F0EBE3',   // slightly deeper for inset areas
  backgroundTertiary:  '#E8E0D5',   // chips, selected filter pills

  // Surfaces (cards, modals, sheets)
  surface:             '#FFFFFF',   // pure white card
  surfaceElevated:     '#FEFCF9',   // barely warm — floating sheets
  surfaceGreen:        '#EEF3EF',   // light green tint — e.g. success banners
  paper:               '#FFFFFF',   // alias — explicit card face

  // Text hierarchy
  text:                '#18211C',   // ink — primary body & headline
  textSecondary:       '#6B7F72',   // muted — secondary copy
  textLight:           '#9AADA2',   // placeholder, disabled
  textMuted:           '#C2CFC7',   // very faint — hint text
  textInverse:         '#F8F5F0',   // text on dark surfaces
  textAccent:          '#A87328',   // gold — prices, eyebrow labels

  // Borders — single hairline value for consistency
  border:              '#E8E2DA',   // hairline — all borders
  borderLight:         '#F0EAE1',   // very subtle — dividers inside cards
  borderStrong:        '#C8BFB5',   // strong — focused inputs

  // Interactive states
  focusRing:           'rgba(27,58,45,0.20)',

  // Overlays
  overlay:             'rgba(8,16,10,0.52)',
  overlayLight:        'rgba(8,16,10,0.22)',
  overlayDark:         'rgba(8,16,10,0.82)',

  // Shadows — warm-toned, not cold blue-grey
  shadow: {
    sm: 'rgba(18, 28, 20, 0.05)',
    md: 'rgba(18, 28, 20, 0.08)',
    lg: 'rgba(18, 28, 20, 0.12)',
    xl: 'rgba(18, 28, 20, 0.18)',
  },
};

// ── Dark Mode ────────────────────────────────────────────────────────────────
export const dark = {
  ...common,

  // Canvas layers
  background:          '#0C1410',
  backgroundSecondary: '#131E17',
  backgroundTertiary:  '#1C2920',

  // Surfaces
  surface:             '#172019',
  surfaceElevated:     '#1F2E23',
  surfaceGreen:        '#1A2D1F',
  paper:               '#172019',

  // Text hierarchy
  text:                '#EEE9E1',
  textSecondary:       '#8DA494',
  textLight:           '#5A7262',
  textMuted:           '#374E3F',
  textInverse:         '#18211C',
  textAccent:          '#E8B86D',

  // Borders
  border:              '#273A2D',
  borderLight:         '#1E2F23',
  borderStrong:        '#3A5242',

  // Interactive
  focusRing:           'rgba(201,147,58,0.30)',

  // Overlays
  overlay:             'rgba(0,0,0,0.72)',
  overlayLight:        'rgba(0,0,0,0.38)',
  overlayDark:         'rgba(0,0,0,0.92)',

  // Shadows
  shadow: {
    sm: 'rgba(0,0,0,0.15)',
    md: 'rgba(0,0,0,0.25)',
    lg: 'rgba(0,0,0,0.35)',
    xl: 'rgba(0,0,0,0.50)',
  },
};

export const ThemeColors = { light, dark };

// ── Dashboard Theme — Editorial Craft ───────────────────────────────────────
// Brand-aligned analytics dashboard. Forest green primary, gold callouts,
// purple reserved for data visualization. Designed with editorial restraint.

export const dashboardDark = {
  // Canvas — Deep Slate / Navy
  bg:              '#090E17',
  bgSecondary:     '#101726',
  surface:         '#172033',
  surfaceHover:    '#1E2A42',
  surfaceAlt:      '#131B2A',
  surfaceElevated: '#1A243A',

  // Borders — Crisp and thin
  border:          '#22304A',
  borderLight:     '#1A253A',
  borderStrong:    '#2A3B5A',

  // Text — High contrast white/slate
  text:            '#F8FAFC',
  textSecondary:   '#94A3B8',
  textMuted:       '#64748B',
  textInverse:     '#0F172A',

  // Primary — Emerald Green (Growth/Success)
  purple:          '#10B981',
  purpleLight:     '#34D399',
  purpleDark:      '#047857',
  purpleMuted:     'rgba(16, 185, 129, 0.12)',
  purpleGlow:      'rgba(16, 185, 129, 0.25)',

  // Accent — Indigo / Purple (for data/focus)
  gold:            '#8B5CF6',
  goldBg:          'rgba(139, 92, 246, 0.12)',

  // Data viz — Blue/Indigo
  dataViz:         '#3B82F6',
  dataVizLight:    '#60A5FA',
  dataVizBg:       'rgba(59, 130, 246, 0.15)',

  // Status — Vibrant, SaaS style
  green:           '#10B981',
  greenBg:         'rgba(16, 185, 129, 0.15)',
  red:             '#EF4444',
  redBg:           'rgba(239, 68, 68, 0.15)',
  amber:           '#F59E0B',
  amberBg:         'rgba(245, 158, 11, 0.15)',
  blue:            '#3B82F6',
  blueBg:          'rgba(59, 130, 246, 0.15)',

  // Chart
  chartLine:       '#10B981',
  chartFill:       'rgba(16, 185, 129, 0.12)',
  chartGrid:       'rgba(255, 255, 255, 0.05)',

  // Sidebar
  sidebarBg:       '#060B12',
  sidebarBorder:   '#131B2A',
  sidebarActive:   'rgba(16, 185, 129, 0.12)',

  // Shadows — Sharp and dark
  shadow:          'rgba(0, 0, 0, 0.5)',
  shadowPurple:    'rgba(16, 185, 129, 0.2)',

  // Overlay
  overlay:         'rgba(0, 0, 0, 0.70)',

  // Glass
  glass:           'rgba(23, 32, 51, 0.75)',
  glassBorder:     'rgba(255, 255, 255, 0.08)',

  // Gradients
  gradient: {
    purplePrimary: ['#10B981', '#047857'] as [string, string],
    purpleGlow:    ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.0)'] as [string, string],
    card:          ['#172033', '#131B2A'] as [string, string],
    sidebar:       ['#060B12', '#0A0F1A'] as [string, string],
    hero:          ['rgba(16, 185, 129, 0.10)', 'rgba(9, 14, 23, 0.0)'] as [string, string],
    gold:          ['#8B5CF6', '#6D28D9'] as [string, string],
  },
};

export const dashboardLight = {
  // Canvas — warm white, not cold lavender
  bg:              '#FAFAF8',
  bgSecondary:     '#F2F0EC',
  surface:         '#FFFFFF',
  surfaceHover:    '#F8F7F5',
  surfaceAlt:      '#F4F2EE',
  surfaceElevated: '#FFFFFF',

  // Borders — warm gray
  border:          '#E6E2DC',
  borderLight:     '#EDEBE6',
  borderStrong:    '#CCC7BF',

  // Text — warm dark, not cold navy
  text:            '#1C1A17',
  textSecondary:   '#70695F',
  textMuted:       '#A39E96',
  textInverse:     '#FFFFFF',

  // Primary — Emerald Green (Growth/Success)
  purple:          '#059669',
  purpleLight:     '#10B981',
  purpleDark:      '#047857',
  purpleMuted:     'rgba(5, 150, 105, 0.08)',
  purpleGlow:      'rgba(5, 150, 105, 0.15)',

  // Accent — Indigo / Purple
  gold:            '#7C3AED',
  goldBg:          'rgba(124, 58, 237, 0.08)',

  // Data viz — Blue/Indigo
  dataViz:         '#2563EB',
  dataVizLight:    '#3B82F6',
  dataVizBg:       'rgba(37, 99, 235, 0.08)',

  // Status — Vibrant, SaaS style
  green:           '#059669',
  greenBg:         'rgba(5, 150, 105, 0.08)',
  red:             '#DC2626',
  redBg:           'rgba(220, 38, 38, 0.08)',
  amber:           '#D97706',
  amberBg:         'rgba(217, 119, 6, 0.08)',
  blue:            '#2563EB',
  blueBg:          'rgba(37, 99, 235, 0.08)',

  // Chart
  chartLine:       '#059669',
  chartFill:       'rgba(5, 150, 105, 0.10)',
  chartGrid:       'rgba(0, 0, 0, 0.04)',

  // Sidebar
  sidebarBg:       '#FAFAF8',
  sidebarBorder:   '#E6E2DC',
  sidebarActive:   'rgba(27, 58, 45, 0.07)',

  // Shadows — warm tint
  shadow:          'rgba(18, 14, 10, 0.06)',
  shadowPurple:    'rgba(27, 58, 45, 0.10)',

  // Overlay
  overlay:         'rgba(0, 0, 0, 0.25)',

  // Glass
  glass:           'rgba(255, 255, 255, 0.85)',
  glassBorder:     'rgba(0, 0, 0, 0.05)',

  // Gradients
  gradient: {
    purplePrimary: ['#059669', '#047857'] as [string, string],
    purpleGlow:    ['rgba(5, 150, 105, 0.12)', 'rgba(5, 150, 105, 0.0)'] as [string, string],
    card:          ['#FFFFFF', '#F8FAFC'] as [string, string],
    sidebar:       ['#FAFAF8', '#F2F0EC'] as [string, string],
    hero:          ['rgba(5, 150, 105, 0.06)', 'rgba(255, 255, 255, 0.0)'] as [string, string],
    gold:          ['#7C3AED', '#5B21B6'] as [string, string],
  },
};

export type DashboardTheme = typeof dashboardDark;

export default light;
