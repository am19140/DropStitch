/**
 * Placeholder line illustrations in the app's style (ink lines, matcha + pink spot colour).
 * They're kept together here so they can be swapped for final artwork later.
 */
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path } from 'react-native-svg';

const INK = '#1C1A17';
const PAPER = '#FBF7F0';
const SURFACE = '#FFFDF8';
const MATCHA = '#898E46';
const PINK = '#FFC0C0';

type ArtProps = { width: number };

/** A knitter sitting on a giant matcha yarn ball, knitting. */
export function SitterArt({ width }: ArtProps) {
  const shirt = 'M100 66 Q114 59 128 66 L124 108 Q110 114 98 108 Z';
  return (
    <Svg width={width} height={(width * 250) / 240} viewBox="0 0 240 250" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Defs>
        <ClipPath id="si-ball"><Circle cx={112} cy={180} r={64} /></ClipPath>
        <ClipPath id="si-shirt"><Path d={shirt} /></ClipPath>
      </Defs>
      <Path d="M60 214 C30 226 20 200 34 196 C48 192 46 214 30 228 C18 238 14 246 4 246" stroke={MATCHA} />
      <Circle cx={112} cy={180} r={64} fill={MATCHA} />
      <G clipPath="url(#si-ball)" stroke={PINK}>
        {[
          'M44 160 C90 150 150 176 170 236', 'M62 124 C102 150 140 200 136 250', 'M112 114 C150 136 178 176 178 206',
          'M48 198 C92 186 130 210 138 250', 'M50 176 C96 168 150 200 160 246', 'M80 120 C110 150 124 200 118 246',
          'M140 120 C164 150 176 186 172 220', 'M52 150 C86 140 124 150 150 124', 'M58 214 C94 206 134 218 162 236',
        ].map((d) => <Path key={d} d={d} />)}
      </G>
      <Path d="M106 108 L146 114 L154 160" strokeWidth={13} />
      <Path d="M114 104 L154 104 L168 148" strokeWidth={13} />
      <Ellipse cx={160} cy={168} rx={10} ry={5} fill={PAPER} transform="rotate(10 160 168)" />
      <Ellipse cx={175} cy={156} rx={10} ry={5} fill={PAPER} transform="rotate(10 175 156)" />
      <Path d={shirt} fill={SURFACE} />
      <G clipPath="url(#si-shirt)" stroke={PINK} strokeWidth={4}>
        <Path d="M94 78 H132" /><Path d="M94 90 H132" /><Path d="M94 102 H132" />
      </G>
      <Path d={shirt} />
      <Path d="M126 96 L186 56" strokeWidth={3.5} />
      <Circle cx={188} cy={55} r={4.5} fill={INK} />
      <Path d="M140 96 L206 82" strokeWidth={3.5} />
      <Circle cx={208} cy={82} r={4.5} fill={INK} />
      <Path d="M142 92 L170 82 L174 112 L146 120 Z" fill={SURFACE} />
      <Path d="M147 100 l4 -4 l4 4 l4 -4 l4 4 l4 -4" stroke={MATCHA} strokeWidth={1.6} />
      <Path d="M149 110 l4 -4 l4 4 l4 -4 l4 4 l4 -4" stroke={MATCHA} strokeWidth={1.6} />
      <Path d="M104 70 C96 86 108 98 128 94" />
      <Circle cx={130} cy={93} r={3.5} fill={PAPER} />
      <Path d="M124 70 C134 80 144 90 150 92" />
      <Circle cx={152} cy={92} r={3.5} fill={PAPER} />
      <Path d="M114 62 L115 56" />
      <Circle cx={116} cy={44} r={12} fill={PAPER} />
      <Path d="M105 41 C105 29 124 27 128 38 C120 35 112 35 106 43 Z" fill={INK} />
      <Circle cx={104} cy={33} r={5} fill={INK} />
      <Circle cx={121} cy={45} r={1.3} fill={INK} stroke="none" />
    </Svg>
  );
}

/** A knitter carrying a giant pink yarn ball. */
export function CarrierArt({ width }: ArtProps) {
  const shirt = 'M172 150 Q187 148 191 160 L165 206 Q152 211 146 198 Z';
  return (
    <Svg width={width} height={(width * 260) / 240} viewBox="0 0 240 260" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Defs>
        <ClipPath id="ca-ball"><Circle cx={92} cy={96} r={74} /></ClipPath>
        <ClipPath id="ca-shirt"><Path d={shirt} /></ClipPath>
      </Defs>
      <Path d="M44 152 C22 188 6 170 18 160 C30 150 40 176 30 200 C22 220 50 230 34 252" stroke={MATCHA} />
      <Circle cx={92} cy={96} r={74} fill={PINK} />
      <G clipPath="url(#ca-ball)" stroke={MATCHA}>
        {[
          'M18 70 C70 58 132 92 152 160', 'M36 34 C80 66 122 118 120 176', 'M84 20 C124 46 162 88 170 120',
          'M16 112 C58 100 104 126 116 176', 'M56 26 C98 58 140 100 160 150', 'M24 90 C64 80 110 110 128 166',
          'M60 26 C100 54 130 104 130 168', 'M110 24 C140 50 162 80 166 100', 'M20 134 C56 124 92 140 100 170',
          'M30 60 C60 40 120 40 150 70',
        ].map((d) => <Path key={d} d={d} />)}
      </G>
      <Path d="M156 200 L184 228 L196 250" strokeWidth={13} />
      <Path d="M150 200 L128 230 L106 246" strokeWidth={13} />
      <Ellipse cx={205} cy={252} rx={10} ry={5} fill={PAPER} />
      <Ellipse cx={97} cy={249} rx={10} ry={5} fill={PAPER} transform="rotate(-20 97 249)" />
      <Path d={shirt} fill={SURFACE} />
      <G clipPath="url(#ca-shirt)" stroke={MATCHA} strokeWidth={4}>
        <Path d="M164 164 L184 176" /><Path d="M158 176 L178 188" /><Path d="M151 188 L171 200" />
      </G>
      <Path d={shirt} />
      <Path d="M176 156 C166 142 158 130 148 120" />
      <Circle cx={146} cy={118} r={3.5} fill={PAPER} />
      <Path d="M186 160 C178 150 172 142 166 134" />
      <Circle cx={164} cy={132} r={3.5} fill={PAPER} />
      <Path d="M185 155 L191 152" />
      <Circle cx={200} cy={146} r={12} fill={PAPER} />
      <Path d="M189 143 C189 131 205 129 211 138 C203 136 195 137 190 146 Z" fill={INK} />
      <Circle cx={205} cy={147} r={1.3} fill={INK} stroke="none" />
    </Svg>
  );
}

/** Empty-state drawing: a pink yarn ball with two matcha needles. */
export function YarnOutlineArt({ width }: ArtProps) {
  return (
    <Svg width={width} height={(width * 170) / 200} viewBox="0 0 200 170" fill="none" stroke={MATCHA} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Defs>
        <ClipPath id="ya-ball"><Circle cx={92} cy={100} r={54} /></ClipPath>
      </Defs>
      <Path d="M60 10 L116 110" />
      <Circle cx={57} cy={6} r={4.5} />
      <Path d="M150 14 L96 112" />
      <Circle cx={153} cy={10} r={4.5} />
      <Circle cx={92} cy={100} r={54} fill={PINK} stroke="#141413" />
      <G clipPath="url(#ya-ball)">
        {[
          'M38 84 C74 74 120 96 136 140', 'M50 56 C86 80 116 120 112 156', 'M96 46 C126 66 148 100 148 120',
          'M38 118 C72 108 100 128 108 156', 'M44 100 C78 92 112 112 124 150', 'M70 50 C100 76 124 112 124 150',
          'M120 52 C140 70 146 96 144 110', 'M40 132 C70 124 92 140 98 154', 'M48 70 C70 56 110 52 136 70',
        ].map((d) => <Path key={d} d={d} />)}
      </G>
      <Path d="M136 132 C156 150 176 128 182 142 C188 156 166 160 170 146 C174 134 196 150 198 158" />
    </Svg>
  );
}
