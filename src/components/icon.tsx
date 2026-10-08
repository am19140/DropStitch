import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Thin outline icons, drawn on a 24×24 grid with round caps to match the illustrations. */
const ICONS = {
  add: ['M12 5v14', 'M5 12h14'],
  remove: ['M5 12h14'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  chevronRight: ['M9 6l6 6-6 6'],
  chevronLeft: ['M15 18l-6-6 6-6'],
  chevronDown: ['M6 9l6 6 6-6'],
  arrowRight: ['M5 12h14', 'M13 6l6 6-6 6'],
  file: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5', 'M9 13h6', 'M9 17h4'],
  photo: ['M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M4 16l5-5 4 4 2-2 5 5'],
  camera: ['M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z'],
  trash: ['M5 7h14', 'M10 4h4', 'M7 7l1 13h8l1-13'],
  edit: ['M4 20h4L19 9l-4-4L4 16z', 'M13 7l4 4'],
  up: ['M12 19V5', 'M6 11l6-6 6 6'],
  down: ['M12 5v14', 'M6 13l6 6 6-6'],
  reset: ['M4 12a8 8 0 1 0 2.4-5.7', 'M4 4v4h4'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  next: ['M7 6l8 6-8 6z', 'M17 6v12'],
  back: ['M17 6l-8 6 8 6z', 'M7 6v12'],
  home: ['M4 11l8-7 8 7', 'M6 10v10h12V10'],
  layers: ['M12 4l8 4-8 4-8-4z', 'M4 12l8 4 8-4', 'M4 16l8 4 8-4'],
  yarn: ['M6.2 8.6c4-1 8.6 1.2 10.6 6.2', 'M9.6 4.6c2.6 3 4.4 8 4.2 15', 'M4.4 14c3.8-.4 7.6 1.6 9.4 5.4'],
  search: ['M20 20l-4-4'],
  more: [],
  calendar: ['M4 10h16', 'M9 3v4', 'M15 3v4'],
  play: ['M8 5.5l10 6.5-10 6.5z'],
  pause: ['M9 5v14', 'M15 5v14'],
} as const;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color: ColorValue;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 22, color, strokeWidth = 1.8, style }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color as string}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}>
      {ICONS[name].map((d) => (
        <Path key={d} d={d} />
      ))}
      {name === 'yarn' && <Circle cx={12} cy={12} r={8} />}
      {name === 'search' && <Circle cx={11} cy={11} r={7} />}
      {name === 'calendar' && <Rect x={4} y={5} width={16} height={15} rx={3} />}
      {name === 'more' && (
        <>
          <Circle cx={5} cy={12} r={1} />
          <Circle cx={12} cy={12} r={1} />
          <Circle cx={19} cy={12} r={1} />
        </>
      )}
    </Svg>
  );
}
