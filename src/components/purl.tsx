import { Image } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

/** Purl, the grandma sheep, in her hand-painted poses. */
const POSES = {
  /** Knitting in her chair: the row counter and active projects. */
  knitting: require('@/assets/images/purl/knitting.webp'),
  /** Reading a pattern: the pattern library. */
  reading: require('@/assets/images/purl/reading.webp'),
  /** Asleep in her chair: when the knitting timer is paused. */
  asleep: require('@/assets/images/purl/asleep.webp'),
  /** Proudly holding up a finished sweater: completed projects. */
  proud: require('@/assets/images/purl/proud.webp'),
  /** Sitting among her yarn, winding a thread: the bottom of the edit page. */
  yarnPile: require('@/assets/images/purl/yarn-pile.webp'),
  /** Just her head: the logo next to the app's name. */
  head: require('@/assets/images/purl/head.png'),
} as const;

export type PurlPose = keyof typeof POSES;

const LABELS: Record<PurlPose, string> = {
  knitting: 'Purl the sheep, knitting in her chair',
  reading: 'Purl the sheep, reading a knitting pattern',
  asleep: 'Purl the sheep, asleep in her chair',
  proud: 'Purl the sheep, proudly holding up a finished sweater',
  yarnPile: 'Purl the sheep sitting among balls of yarn',
  head: 'Purl the sheep',
};

export function Purl({ pose, size, style }: { pose: PurlPose; size: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={POSES[pose]}
      accessibilityLabel={LABELS[pose]}
      contentFit="contain"
      transition={200}
      style={[{ width: size, height: size }, style]}
    />
  );
}
