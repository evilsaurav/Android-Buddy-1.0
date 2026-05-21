export const COLORS = {
  primary: '#8B5CF6', // Vibrant Purple
  primaryLight: '#A78BFA',
  primaryDark: '#6D28D9',
  secondary: '#06B6D4', // Neon Cyan
  secondaryLight: '#67E8F9',
  accent: '#F43F5E', // Rose
  accentLight: '#FDA4AF',
  background: '#0B1121', // Deep dark blue
  surface: '#151E32', // Elevated dark
  surfaceAlt: '#1E293B', // Higher elevation
  card: '#151E32',
  text: '#F8FAFC', // Near white
  textSecondary: '#94A3B8', // Slate 400
  textMuted: '#64748B', // Slate 500
  border: '#1E293B',
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  gradient1: '#8B5CF6',
  gradient2: '#3B82F6',
  gradient3: '#06B6D4',
  white: '#FFFFFF', // Keep literal white
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const FONTS = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: COLORS.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, color: COLORS.text, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const, color: COLORS.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: COLORS.text, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, color: COLORS.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: COLORS.textSecondary },
  small: { fontSize: 11, fontWeight: '500' as const, color: COLORS.textMuted },
};
