/**
 * DropStitch theme, taken from Purl: cobalt blue and red as the main colours,
 * with beige, light blue and chocolate as secondary colours. Light-only for now.
 */

import '@/global.css';

const palette = {
  /** Page background: light beige. */
  background: '#F6F1E3',
  /** Cards and sheets. */
  surface: '#FFFCF4',
  /** Ink: Purl's dark brown face. */
  text: '#2A1C18',
  textSecondary: '#6E5A50',
  border: '#E3D8C2',
  /** Cobalt blue, from Purl's chair: primary buttons and the active tab. */
  primary: '#034FC9',
  /** Text and icons on top of `primary`. */
  onPrimary: '#FFFFFF',
  /** Red, from Purl's shawl and slippers: highlights. White text on it only at 18px+ bold. */
  red: '#F51614',
  onRed: '#FFFFFF',
  /** Light blue. Takes ink text. */
  sky: '#80ABD7',
  skySoft: '#D7E5F4',
  /** Beige. Takes ink text. */
  beige: '#E2D9BC',
  /** Chocolate. Takes white text. */
  cocoa: '#683629',
  danger: '#B20E19',
  // Kept for components written against the earlier theme names.
  backgroundElement: '#FFFCF4',
  backgroundSelected: '#80ABD7',
  primarySoft: '#D7E5F4',
  success: '#034FC9',
} as const;

export const Colors = { light: palette, dark: palette } as const;

export type ThemeColor = keyof typeof palette;

/** Box colours for projects, like paint-chip cards. All take ink text. */
export const ProjectColors = ['#80ABD7', '#E2D9BC', '#D7E5F4', '#EAD9A8', '#B9CFEA', '#F3D2C8'];

/** Font families, loaded in app/_layout.tsx. Custom fonts need one family per weight. */
export const Fonts = {
  display: 'Fraunces-Black',
  displayItalic: 'Fraunces-BlackItalic',
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
  /** Little notes and messages: straight Fraunces italic. */
  note: 'Fraunces-BlackItalic',
  // Older names still used by a few components.
  sans: 'Manrope_500Medium',
  mono: 'monospace',
  rounded: 'Manrope_500Medium',
  serif: 'Fraunces-Black',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = { card: 24, box: 22, input: 16, pill: 999 } as const;

/** Soft, warm card shadow. */
export const CardShadow = { boxShadow: '0 8px 24px rgba(92, 64, 32, 0.10)' } as const;

export const MaxContentWidth = 800;
