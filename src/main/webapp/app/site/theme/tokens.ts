/**
 * Design Tokens for Site Modules
 * Single source of truth for all UI values.
 * DO NOT hardcode these values in components.
 */

// Z-Index Scale (prevents z-index wars)
export const Z_INDEX = {
  base: 0,
  sticky: 10,
  dropdown: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
} as const;

export type ZIndex = (typeof Z_INDEX)[keyof typeof Z_INDEX];

// Color Tokens
export const COLORS = {
  // Background
  bg: {
    default: '#F8FAFC',
    surface: '#FFFFFF',
    muted: '#F1F5F9',
  },

  // Text
  text: {
    default: '#1E293B',
    muted: '#64748B',
    inverse: '#FFFFFF',
  },

  // Border
  border: {
    default: '#E2E8F0',
    focus: '#3B82F6',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
  },

  // Brand
  brand: {
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#60A5FA',
    cta: '#F97316',
    ctaDark: '#EA580C',
  },

  // Semantic
  state: {
    success: '#22C55E',
    successBg: '#DCFCE7',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    error: '#EF4444',
    errorBg: '#FEE2E2',
    info: '#3B82F6',
    infoBg: '#DBEAFE',
  },

  // Selection Highlight (for 3D and list sync)
  selection: {
    default: '#3B82F6',
    hover: '#60A5FA',
  },

  // Rotation Icon Colors (L=Length, W=Width, H=Height)
  rotation: {
    length: '#E74C3C', // 红色 - L
    width: '#3498DB', // 蓝色 - W
    height: '#F1C40F', // 黄色 - H
  },
} as const;

// Typography Scale (Inter font)
export const TYPOGRAPHY = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
  } as const,

  // Font size scale (pixels, will be converted to rem in CSS)
  fontSize: {
    h1: 24,
    h2: 18,
    h3: 16,
    body: 14,
    small: 12,
    caption: 11,
  } as const,

  // Line heights (unitless ratio)
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  } as const,
} as const;

// Spacing Scale (4px base unit)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// Border Radius
export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Shadow
export const SHADOW = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  focus: '0 0 0 3px rgba(59, 130, 246, 0.3)',
} as const;

// Layout
export const LAYOUT = {
  // Left panel width
  panelWidth: {
    narrow: 320,
    default: 380,
    wide: 440,
  } as const,

  // Minimum heights (prevents CLS)
  minHeight: {
    canvas: 500, // px - minimum for right canvas
    formSection: 120,
  } as const,

  // Sidebar/Header heights
  header: {
    default: 56,
  } as const,
} as const;

// Transitions
export const TRANSITION = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Breakpoints (for reference - should use CSS media queries)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;
