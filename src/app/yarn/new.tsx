import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ColourPicker } from '@/components/colour-picker';
import { Icon } from '@/components/icon';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { WaveBand } from '@/components/wave-band';
import { YarnBall, type YarnAppearance } from '@/components/yarn-ball';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useProjects } from '@/store/projects';

const C = Colors.light;

/** A short palette from Mrs Purl's world; any other colour comes from the colour picker. */
const YARN_COLOURS = [
  { name: 'Midnight', hex: '#0C2467' },
  { name: 'Cherry', hex: '#A00200' },
  { name: 'Olive', hex: '#9A9156' },
  { name: 'Oat milk', hex: '#EFDBB7' },
  { name: 'Blush', hex: '#FEDBD0' },
  { name: 'Hot cocoa', hex: '#683629' },
  { name: 'Snow', hex: '#F7F4EE' },
  { name: 'Charcoal', hex: '#3B3835' },
];
const LOOKS: { value: YarnAppearance; label: string }[] = [
  { value: 'fine', label: 'Fine' },
  { value: 'smooth', label: 'Smooth' },
  { value: 'chunky', label: 'Chunky' },
];
const MATERIALS = ['Wool', 'Merino', 'Cotton', 'Alpaca', 'Acrylic', 'Blend'];
const NEEDLES = ['2.5 mm', '3 mm', '3.5 mm', '4 mm', '4.5 mm', '5 mm', '6 mm'];

export default function NewYarnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addYarn = useProjects((s) => s.addYarn);
  const [selected, setSelected] = useState<{ name: string; hex: string }>(YARN_COLOURS[0]);
  const [picking, setPicking] = useState(false);
  const custom = !YARN_COLOURS.some((c) => c.hex === selected.hex);
  const [name, setName] = useState('');
  const [material, setMaterial] = useState('');
  const [needles, setNeedles] = useState<string[]>([]);
  const [appearance, setAppearance] = useState<YarnAppearance>('smooth');

  const canSave = material.trim().length > 0;

  const save = () => {
    addYarn({ name: name.trim(), colorName: selected.name, hex: selected.hex, material: material.trim(), needles, appearance });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* The yarn as it will look in your stash, updating as you choose. */}
        <WaveBand
          style={{ paddingBottom: 26 }}
          art={<YarnBall color={selected.hex} appearance={appearance} size={170} />}
          artStyle={{ right: 6, bottom: -2 }}>
          <ScreenHeader back="close" round />
          <Text style={styles.title}>New yarn{'\n'}ball</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {selected.name}
            {'\n'}
            {(name.trim() || 'Unnamed yarn') + (material.trim() ? ` · ${material.trim()}` : '')}
          </Text>
        </WaveBand>

        <View style={styles.content}>
          <TextField
            label="Name · optional"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Drops Merino Extra Fine"
          />

          <View style={{ gap: 10 }}>
            <ThemedText type="eyebrow" themeColor="textSecondary">COLOUR</ThemedText>
            <View style={styles.swatches}>
              {YARN_COLOURS.map((c) => (
                <Pressable
                  key={c.hex}
                  accessibilityRole="button"
                  accessibilityLabel={c.name}
                  accessibilityState={{ selected: c.hex === selected.hex }}
                  onPress={() => setSelected(c)}
                  style={[styles.swatchRing, c.hex === selected.hex && { borderColor: C.text }]}>
                  <View style={[styles.swatch, { backgroundColor: c.hex }]} />
                </Pressable>
              ))}
              {/* Any other colour: a rainbow swatch that opens the colour picker. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose your own colour"
                accessibilityState={{ selected: custom }}
                onPress={() => setPicking(true)}
                style={[styles.swatchRing, custom && { borderColor: C.text }]}>
                <View style={[styles.swatch, styles.rainbow]}>
                  {custom ? (
                    <View style={[styles.customDot, { backgroundColor: selected.hex }]} />
                  ) : (
                    <Icon name="add" size={16} color={C.text} strokeWidth={2.6} />
                  )}
                </View>
              </Pressable>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <ThemedText type="eyebrow" themeColor="textSecondary">LOOKS LIKE</ThemedText>
            <View style={styles.looks}>
              {LOOKS.map((l) => (
                <Pressable
                  key={l.value}
                  accessibilityRole="button"
                  accessibilityLabel={`${l.label} yarn`}
                  accessibilityState={{ selected: appearance === l.value }}
                  onPress={() => setAppearance(l.value)}
                  style={[styles.look, appearance === l.value && styles.lookOn]}>
                  <YarnBall color={selected.hex} appearance={l.value} size={64} />
                  <Text style={styles.chipText}>{l.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <TextField label="Material" value={material} onChangeText={setMaterial} placeholder="e.g. merino wool" />
            <Chips options={MATERIALS} isOn={(m) => material === m} onPress={setMaterial} />
          </View>

          <View style={{ gap: 10 }}>
            <ThemedText type="eyebrow" themeColor="textSecondary">NEEDLES THAT FIT · OPTIONAL</ThemedText>
            <Chips
              options={NEEDLES}
              isOn={(n) => needles.includes(n)}
              onPress={(n) => setNeedles(needles.includes(n) ? needles.filter((x) => x !== n) : [...needles, n])}
            />
          </View>
        </View>
      </ScrollView>

      <ColourPicker
        key={picking ? 'open' : 'closed'}
        visible={picking}
        initial={selected.hex}
        appearance={appearance}
        onCancel={() => setPicking(false)}
        onPick={(hex) => {
          setSelected({ name: hex, hex });
          setPicking(false);
        }}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Button label="Save yarn" size="large" disabled={!canSave} onPress={save} />
      </View>
    </KeyboardAvoidingView>
  );
}

function Chips({ options, isOn, onPress }: { options: string[]; isOn: (o: string) => boolean; onPress: (o: string) => void }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = isOn(o);
        return (
          <Pressable
            key={o}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onPress(o)}
            style={[styles.chip, on && { backgroundColor: C.sky, borderColor: C.sky }]}>
            <Text style={styles.chipText}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: Spacing.four, gap: 22 },
  title: { marginTop: 10, fontFamily: Fonts.display, fontSize: 32, lineHeight: 36, color: C.text },
  subtitle: { marginTop: 8, maxWidth: 190, fontFamily: Fonts.semibold, fontSize: 14, lineHeight: 19, color: C.text, opacity: 0.75 },
  looks: { flexDirection: 'row', gap: 10 },
  look: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 18, borderWidth: 1.5, borderColor: C.cardLine, backgroundColor: C.card },
  lookOn: { borderColor: C.text, backgroundColor: C.surface },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  swatches: { flexDirection: 'row', justifyContent: 'space-between' },
  swatchRing: { width: 37, height: 37, borderRadius: 19, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 29, height: 29, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(28, 26, 23, 0.15)', alignItems: 'center', justifyContent: 'center' },
  rainbow: { backgroundImage: 'conic-gradient(#F51614, #F4D242, #008471, #80ABD7, #034FC9, #B9A3D9, #F51614)', backgroundColor: '#E1E9F4' },
  customDot: { width: 15, height: 15, borderRadius: 8, borderWidth: 2.5, borderColor: '#FFFFFF' },
  more: { alignSelf: 'center', minHeight: 44, paddingHorizontal: 18, borderRadius: 22, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', gap: 6 },
  moreText: { fontFamily: Fonts.semibold, fontSize: 14, color: C.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface, justifyContent: 'center' },
  chipText: { fontFamily: Fonts.semibold, fontSize: 14, color: C.text },
  footer: { paddingHorizontal: Spacing.four, paddingTop: 14, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
});
