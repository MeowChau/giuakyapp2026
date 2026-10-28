import type { TextStyle, ViewStyle } from 'react-native';
import { colors } from './colors';

export { colors } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};
export const radius = { sm: 8, md: 12, lg: 14, xl: 24 };

export const typography = {
  display: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -1,
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 18 },
  overline: {
    fontSize: 11,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
} satisfies Record<string, TextStyle>;

export const cardShadow: ViewStyle = {
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};
