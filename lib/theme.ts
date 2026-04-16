export const COLORS = {
  primary: '#4A6CF7',
  primaryLight: '#7B93FA',
  primaryDark: '#3451D1',
  secondary: '#8B5CF6',
  secondaryLight: '#A78BFA',
  accent: '#06B6D4',
  accentLight: '#67E8F9',
  background: '#F0F4FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFF',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  gradient1: '#4A6CF7',
  gradient2: '#8B5CF6',
  gradient3: '#06B6D4',
  white: '#FFFFFF',
  black: '#0F172A',
  overlay: 'rgba(15, 23, 42, 0.5)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#4A6CF7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#4A6CF7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#4A6CF7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const FONTS = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: COLORS.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, color: COLORS.text, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const, color: COLORS.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: COLORS.text, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, color: COLORS.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: COLORS.textSecondary },
  small: { fontSize: 11, fontWeight: '500' as const, color: COLORS.textMuted },
};
