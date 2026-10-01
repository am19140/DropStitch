import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Path } from 'react-native-svg';

const STRANDS = [
  'M3 18c11 1 22 10 26 26',
  'M10 5c8 6 16 22 16 40',
  'M2 30c12-3 26-1 36 8',
  'M22 2c9 3 18 11 22 22',
  'M4 24c10 0 20 6 24 20',
  'M16 4c6 8 10 20 8 40',
  'M30 4c6 6 12 16 14 26',
  'M6 34c8-4 18-2 26 6',
];

/** Rough "is this a light colour" check, so strands stay visible on any yarn colour. */
function isLight(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

/** A drawn yarn ball in any colour, with a curly loose end. */
export function YarnBall({ color, size = 76, id }: { color: string; size?: number; id?: string }) {
  const autoId = useId().replace(/:/g, '');
  const clipId = id ?? `yarn-${autoId}`;
  const strand = isLight(color) ? 'rgba(28, 26, 23, 0.35)' : 'rgba(255, 228, 223, 0.85)';
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx={24} cy={24} r={20} />
        </ClipPath>
      </Defs>
      <Circle cx={24} cy={24} r={20} fill={color} />
      <G clipPath={`url(#${clipId})`} fill="none" stroke={strand} strokeWidth={1.4} strokeLinecap="round">
        {STRANDS.map((d) => (
          <Path key={d} d={d} />
        ))}
      </G>
      <Circle cx={24} cy={24} r={20} fill="none" stroke="#1C1A17" strokeWidth={1.2} />
      <Path
        d="M41 33c5 3 3 9 -1 9c-4 0 -3 -6 2 -5c4 1 4 6 2 9"
        fill="none"
        stroke="#1C1A17"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
