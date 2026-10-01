/**
 * DropStitch "strawberry matcha" theme: pinks and matcha greens on very light beige.
 * The app is light-only for now (see app.json userInterfaceStyle).
 */

import '@/global.css';

const palette = {
  /** Page background: very light beige. */
  background: '#FBF7F0',
  /** Cards and sheets. */
  surface: '#FFFDF8',
  text: '#1C1A17',
  textSecondary: '#6F685E',
  border: '#ECE3D5',
  /** Strawberry (tomato): primary buttons, active tab. */
  primary: '#C45F3F',
  /** Text and icons on top of `primary` — only at 18px+ bold. */
  onPrimary: '#FFE4DF',
  /** Strawberry milk. */
  pink: '#FFC0C0',
  blush: '#FFE4DF',
  /** Matcha. Text on matcha is always ink. */
  matcha: '#898E46',
  matchaMilk: '#E3E6C3',
  danger: '#B3261E',
  // Kept for components written against the earlier theme names.
  backgroundElement: '#FFFDF8',
  backgroundSelected: '#FFC0C0',
  primarySoft: '#FFE4DF',
  success: '#898E46',
} as const;

export const Colors = { light: palette, dark: palette } as const;

export type ThemeColor = keyof typeof palette;

/** Box colours for projects, like paint-chip cards. All take ink text. */
export const ProjectColors = ['#FFC0C0', '#898E46', '#E3E6C3', '#F29CC3', '#D6D35F', '#FFE4DF'];

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
