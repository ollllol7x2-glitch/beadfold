import type { ViewStyle } from 'react-native';

export const colors = {
  espresso: '#2D211B',
  espressoSoft: '#4A382E',
  espressoPressed: '#17110E',
  cream: '#F7F2EA',
  creamDeep: '#EFE6DA',
  warmBeige: '#E4D5C4',
  oat: '#D7C1AA',
  taupe: '#A58D78',
  cocoa: '#745746',
  softGold: '#B58E54',
  terracotta: '#A94F39',
  charcoal: '#2A2725',
  neutral950: '#1D1815',
  neutral800: '#504740',
  neutral600: '#756B64',
  neutral400: '#A89D94',
  neutral200: '#DED5CC',
  neutral100: '#EEE7E0',
  white: '#FFFDF9',
  success: '#315F4B',
  error: '#9A3832',
  focus: '#76541F',
  overlay: 'rgba(27, 19, 14, 0.52)',
} as const;

export const spacing = {
  hairline: 2,
  xs: 4,
  compact: 8,
  small: 12,
  default: 16,
  roomy: 20,
  section: 24,
  large: 32,
  hero: 40,
} as const;

export const radius = { xs: 6, small: 10, medium: 14, large: 18, xl: 24, hero: 30, full: 999 } as const;

export const fonts = {
  regular: 'SUIT-Regular',
  medium: 'SUIT-Medium',
  semibold: 'SUIT-SemiBold',
  bold: 'SUIT-Bold',
} as const;

export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 42, letterSpacing: -0.8 },
  title1: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 36, letterSpacing: -0.5 },
  title2: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 30, letterSpacing: -0.25 },
  title3: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 26, letterSpacing: -0.1 },
  bodyLarge: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 26 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  brewNumber: { fontFamily: fonts.bold, fontSize: 60, lineHeight: 68, letterSpacing: -1.5 },
} as const;

export const shadows: Record<'soft' | 'lifted', ViewStyle> = {
  soft: {
    shadowColor: colors.espresso,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  lifted: {
    shadowColor: colors.espresso,
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
};
