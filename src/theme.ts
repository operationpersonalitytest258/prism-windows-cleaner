import {
  createDarkTheme,
  BrandVariants,
} from '@fluentui/react-components';

/**
 * Mole brand palette — green-accent system utility theme
 * Based on UIUX Pro Max MASTER.md (#22C55E accent + #020617 bg)
 */
const moleBrand: BrandVariants = {
  10: '#020617',
  20: '#0A1628',
  30: '#0F2A1D',
  40: '#14532D',
  50: '#166534',
  60: '#16A34A',
  70: '#22C55E',
  80: '#4ADE80',
  90: '#86EFAC',
  100: '#BBF7D0',
  110: '#DCFCE7',
  120: '#F0FDF4',
  130: '#F0FDF4',
  140: '#F8FAFC',
  150: '#F8FAFC',
  160: '#FFFFFF',
};

export const moleDarkTheme = {
  ...createDarkTheme(moleBrand),
  colorNeutralBackground1: '#020617',
  colorNeutralBackground2: '#0F172A',
  colorNeutralBackground3: '#1E293B',
  colorBrandBackground: '#22C55E',
  colorBrandBackgroundHover: '#16A34A',
  colorBrandBackgroundPressed: '#15803D',
  colorBrandForeground1: '#22C55E',
  colorBrandForeground2: '#4ADE80',
};
