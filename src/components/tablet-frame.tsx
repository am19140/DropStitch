import type { ReactNode } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Colors } from '@/constants/theme';

const C = Colors.light;

/** How wide the app is laid out on a big screen, in phone points, before it's scaled up. */
const COLUMN = 540;
/** From this window width on, the app sits in a centred column. */
const WIDE_FROM = 700;
/** Never bigger than this, so a big iPad doesn't get a cartoonish phone. */
const MAX_SCALE = 1.3;

export type Frame = {
  /** How much the column is scaled up. */
  scale: number;
  /** The column's size in phone points (what the screens lay themselves out in). */
  width: number;
  height: number;
  /** Where the scaled column starts on the window, in window pixels. */
  left: number;
};

/**
 * The column for a window: as large as fits the width (with some room on the sides) and the height
 * (so the screens keep a phone's proportions), never smaller than the phone size. Null on phones.
 */
export function tabletFrame(width: number, height: number): Frame | null {
  if (Platform.OS !== 'web' || width < WIDE_FROM) return null;
  const scale = Math.min(MAX_SCALE, Math.max(1, Math.min(width / (COLUMN + 120), height / 740)));
  return { scale, width: COLUMN, height: height / scale, left: (width - COLUMN * scale) / 2 };
}

/** The current column, or null on phones. */
export function useTabletFrame() {
  const { width, height } = useWindowDimensions();
  return tabletFrame(width, height);
}

/** A box measured on the window (like measureInWindow gives), in the column's own points. */
export function toFrame<T extends { x: number; y: number; width: number; height: number }>(box: T, frame: Frame | null): T {
  if (!frame) return box;
  return { ...box, x: (box.x - frame.left) / frame.scale, y: box.y / frame.scale, width: box.width / frame.scale, height: box.height / frame.scale };
}

/**
 * In the browser on an iPad (or any wide window), lays the app out as a phone-sized column and scales
 * the whole column up as one piece, centred: every box, text and painting grows together. Overlays
 * (sheets, the tour, pickers) wrap themselves in it too, with `pageColor` for what shows beside the
 * column. Phones are left alone.
 */
export function TabletFrame({ children, pageColor = C.background }: { children: ReactNode; pageColor?: string }) {
  const frame = useTabletFrame();
  if (!frame) return <>{children}</>;
  return (
    <View style={[styles.page, { backgroundColor: pageColor }]}>
      <View style={{ width: frame.width, height: frame.height, transform: [{ scale: frame.scale }], transformOrigin: 'top center' }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', overflow: 'hidden' },
});
