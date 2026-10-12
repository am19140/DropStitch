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
  home: ['M9.5 20H6.5a2 2 0 0 1-2-2v-7.2L12 4.5l7.5 6.3V18a2 2 0 0 1-2 2h-3v-4.5a2.5 2.5 0 0 0-5 0z'],
  /** A note with lines: the projects list. */
  notes: ['M5 7.5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z', 'M8.75 9h6.5', 'M8.75 12h6.5', 'M8.75 15h4'],
  layers: ['M12 4l8 4-8 4-8-4z', 'M4 12l8 4 8-4', 'M4 16l8 4 8-4'],
  yarn: ['M6.2 8.6c4-1 8.6 1.2 10.6 6.2', 'M9.6 4.6c2.6 3 4.4 8 4.2 15', 'M4.4 14c3.8-.4 7.6 1.6 9.4 5.4', 'M17 17.6c1.2 1.5 2.6 2.1 4.2 2'],
  search: ['M20 20l-4-4'],
  more: [],
  calendar: ['M4 10h16', 'M9 3v4', 'M15 3v4'],
  play: ['M8 5.5l10 6.5-10 6.5z'],
  pause: ['M9 5v14', 'M15 5v14'],
  settings: ['M12.2 2.5h-.4a1.9 1.9 0 0 0-1.9 1.9v.2a1.9 1.9 0 0 1-.95 1.64l-.4.23a1.9 1.9 0 0 1-1.9 0l-.15-.08a1.9 1.9 0 0 0-2.6.7l-.2.36a1.9 1.9 0 0 0 .7 2.6l.14.09a1.9 1.9 0 0 1 .95 1.64v.48a1.9 1.9 0 0 1-.95 1.65l-.14.08a1.9 1.9 0 0 0-.7 2.6l.2.36a1.9 1.9 0 0 0 2.6.7l.15-.08a1.9 1.9 0 0 1 1.9 0l.4.23a1.9 1.9 0 0 1 .95 1.64v.2a1.9 1.9 0 0 0 1.9 1.9h.4a1.9 1.9 0 0 0 1.9-1.9v-.2a1.9 1.9 0 0 1 .95-1.64l.4-.23a1.9 1.9 0 0 1 1.9 0l.15.08a1.9 1.9 0 0 0 2.6-.7l.2-.37a1.9 1.9 0 0 0-.7-2.6l-.14-.07a1.9 1.9 0 0 1-.95-1.65v-.47a1.9 1.9 0 0 1 .95-1.65l.14-.09a1.9 1.9 0 0 0 .7-2.6l-.2-.36a1.9 1.9 0 0 0-2.6-.7l-.15.08a1.9 1.9 0 0 1-1.9 0l-.4-.23a1.9 1.9 0 0 1-.95-1.64v-.2a1.9 1.9 0 0 0-1.9-1.9z'],
  star: ['M12 3.8l2.4 5 5.4.7-4 3.8 1 5.4-4.8-2.6-4.8 2.6 1-5.4-4-3.8 5.4-.7z'],
  mail: ['M4.5 7.5l7.5 5.5 7.5-5.5'],
  shield: ['M12 3.5l7 2.8v5.4c0 4.3-2.9 7.4-7 8.8-4.1-1.4-7-4.5-7-8.8V6.3z', 'M9 12l2.2 2.2L15.5 10'],
  user: ['M5 20c1.2-3.6 3.8-5.4 7-5.4s5.8 1.8 7 5.4'],
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
      {name === 'user' && <Circle cx={12} cy={8.5} r={3.8} />}
      {name === 'settings' && <Circle cx={12} cy={12} r={3} />}
      {name === 'mail' && <Rect x={3} y={5} width={18} height={14} rx={3} />}
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
