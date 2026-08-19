import type { ViewStyle } from 'react-native';

export const colors = {
  // Neutral foundation: near-white limestone surfaces with restrained tonal steps.
  espresso: '#282521',
  espressoSoft: '#55504B',
  espressoPressed: '#191613',
  cream: '#F7F4F0',
  creamDeep: '#F0ECE6',
  warmBeige: '#E1DBD3',
  oat: '#E1DBD3',
  taupe: '#AAA29A',
  cocoa: '#59524C',
  charcoal: '#282521',
  neutral950: '#1A1714',
  neutral800: '#594F49',
  neutral600: '#8C827B',
  neutral400: '#AAA29F',
  neutral200: '#E1DBD3',
  neutral100: '#F0ECE6',
  white: '#FEFDFC',
  // Primary action and selection.
  action: '#790C41',
  actionPressed: '#5D0830',
  actionWash: '#F8EEF2',
  // Supporting colors are intentionally light; their darker partners are for icons and bars.
  softGold: '#F9E999',
  terracotta: '#EDA3A5',
  berry: '#C75387',
  apricot: '#B79B2F',
  sage: '#4D9B79',
  teal: '#2C4A3C',
  blue: '#6E95AB',
  plum: '#9B78B8',
  berryWash: '#FFB1D6',
  apricotWash: '#F9E999',
  sageWash: '#98DCBF',
  tealWash: '#BEE1F2',
  blueWash: '#C6CDFE',
  success: '#2C4A3C',
  error: '#B8425D',
  focus: '#790C41',
  overlay: 'rgba(32, 34, 35, 0.54)',
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
  headerTitle: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.35 },
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
