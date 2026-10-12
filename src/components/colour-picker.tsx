import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Button } from '@/components/button';
import { YarnBall, type YarnAppearance } from '@/components/yarn-ball';
import { normalizeYarnHex } from '@/components/yarn-colors';
import { CardShadow, Colors, Fonts } from '@/constants/theme';

const C = Colors.light;

type Hsv = { h: number; s: number; v: number };

function hexToHsv(hex: string): Hsv {
  const n = normalizeYarnHex(hex);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max };
}

function hsvToHex({ h, s, v }: Hsv) {
  const f = (k: number) => {
    const x = (k + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(x, 4 - x, 1));
  };
  return `#${[f(5), f(3), f(1)].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

const clamp = (x: number) => Math.max(0, Math.min(1, x));

/** A touch area that reports where the finger is, from 0 to 1 across and down, while dragging. */
function DragArea({ onMove, style, children }: { onMove: (x: number, y: number) => void; style: object; children: React.ReactNode }) {
  const size = useRef({ w: 1, h: 1 });
  const move = (e: GestureResponderEvent) =>
    onMove(clamp(e.nativeEvent.locationX / size.current.w), clamp(e.nativeEvent.locationY / size.current.h));
  return (
    <View
      style={style}
      onLayout={(e: LayoutChangeEvent) => (size.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={move}
      onResponderMove={move}>
      {/* The drawings don't take touches, so positions are always measured on this area. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {children}
      </View>
    </View>
  );
}

type ColourPickerProps = {
  visible: boolean;
  initial: string;
  appearance: YarnAppearance;
  onCancel: () => void;
  onPick: (hex: string) => void;
};

/** Pick any colour: drag on the shade box and rainbow strip, or type a hex code. The yarn ball follows live. */
export function ColourPicker({ visible, initial, appearance, onCancel, onPick }: ColourPickerProps) {
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(initial));
  const [typed, setTyped] = useState<string | null>(null);
  const hex = hsvToHex(hsv);
  const hue = hsvToHex({ h: hsv.h, s: 1, v: 1 });

  const typeHex = (text: string) => {
    setTyped(text);
    const clean = text.trim().replace(/^#/, '');
    if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(clean)) setHsv(hexToHsv(clean));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.layer}>
        <Pressable accessibilityLabel="Cancel" style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={[styles.card, CardShadow]}>
          <Text style={styles.title}>Your own colour</Text>
          <YarnBall color={hex} appearance={appearance} size={150} style={{ alignSelf: 'center', marginVertical: -6 }} />

          <DragArea style={styles.shades} onMove={(x, y) => { setTyped(null); setHsv((c) => ({ ...c, s: x, v: 1 - y })); }}>
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id="white" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
                  <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                </LinearGradient>
                <LinearGradient id="black" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#000000" stopOpacity="0" />
                  <Stop offset="1" stopColor="#000000" stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill={hue} />
              <Rect width="100%" height="100%" fill="url(#white)" />
              <Rect width="100%" height="100%" fill="url(#black)" />
            </Svg>
            <View style={[styles.knob, { left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: hex }]} />
          </DragArea>

          <DragArea style={styles.hues} onMove={(x) => { setTyped(null); setHsv((c) => ({ ...c, h: Math.min(359.9, x * 360) })); }}>
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id="rainbow" x1="0" y1="0" x2="1" y2="0">
                  {[0, 60, 120, 180, 240, 300, 360].map((h) => (
                    <Stop key={h} offset={String(h / 360)} stopColor={hsvToHex({ h: h % 360, s: 1, v: 1 })} />
                  ))}
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" rx="14" fill="url(#rainbow)" />
            </Svg>
            <View style={[styles.hueKnob, { left: `${(hsv.h / 360) * 100}%`, backgroundColor: hue }]} />
          </DragArea>

          <View style={styles.hexRow}>
            <View style={[styles.swatch, { backgroundColor: hex }]} />
            <Text style={styles.hexLabel}>Hex</Text>
            <TextInput
              value={typed ?? hex}
              onChangeText={typeHex}
              onBlur={() => setTyped(null)}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={7}
              placeholder="#5D82C3"
              placeholderTextColor={C.textSecondary}
              accessibilityLabel="Hex colour code"
              style={styles.hexInput}
            />
          </View>

          <View style={styles.buttons}>
            <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.flex} />
            <Button label="Use colour" onPress={() => onPick(hex)} style={styles.flex} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  layer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(28, 26, 23, 0.4)' },
  card: { width: '100%', maxWidth: 380, padding: 20, borderRadius: 26, backgroundColor: C.surface, gap: 14 },
  title: { fontFamily: Fonts.display, fontSize: 22, color: C.text, textAlign: 'center' },
  shades: { height: 170, borderRadius: 18, overflow: 'hidden' },
  knob: { position: 'absolute', width: 26, height: 26, marginLeft: -13, marginTop: -13, borderRadius: 13, borderWidth: 3, borderColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.35)' },
  hues: { height: 28, borderRadius: 14 },
  hueKnob: { position: 'absolute', top: -3, width: 34, height: 34, marginLeft: -17, borderRadius: 17, borderWidth: 3, borderColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.35)' },
  hexRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(28, 26, 23, 0.15)' },
  hexLabel: { fontFamily: Fonts.extrabold, fontSize: 13, letterSpacing: 1.5, color: C.textSecondary },
  hexInput: {
    flex: 1,
    minWidth: 0,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.cardLine,
    backgroundColor: C.card,
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: C.text,
  },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 2 },
  flex: { flex: 1 },
});
