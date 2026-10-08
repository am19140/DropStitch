import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { YarnBall } from '@/components/yarn-ball';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useProjects } from '@/store/projects';

const C = Colors.light;

const YARN_COLOURS = [
  { name: 'Purl’s chair', hex: '#034FC9' },
  { name: 'Shawl red', hex: '#F51614' },
  { name: 'Sky wash', hex: '#80ABD7' },
  { name: 'Fleece', hex: '#E2D9BC' },
  { name: 'Hot cocoa', hex: '#683629' },
  { name: 'Tomato jam', hex: '#C45F3F' },
  { name: 'Peony bundle', hex: '#FFC0C0' },
  { name: 'Monet ponds', hex: '#898E46' },
  { name: 'Matcha milk', hex: '#E3E6C3' },
  { name: 'Pure sun', hex: '#F4D242' },
  { name: 'Airplane view', hex: '#80B0E8' },
  { name: 'Autumn lavender', hex: '#D1CAEA' },
  { name: 'Limeade', hex: '#D6D35F' },
  { name: 'Bubble gum', hex: '#F29CC3' },
  { name: 'Tropical rain', hex: '#008471' },
  { name: 'Oatmeal', hex: '#E9DCC6' },
  { name: 'Charcoal', hex: '#3B3835' },
  { name: 'Strawberry', hex: '#E0475B' },
  { name: 'Raspberry', hex: '#B8336A' },
  { name: 'Blush', hex: '#FFE4DF' },
  { name: 'Sage', hex: '#A8B88A' },
  { name: 'Forest', hex: '#3F5E3A' },
  { name: 'Mint', hex: '#BDE3C8' },
  { name: 'Mustard', hex: '#D9A520' },
  { name: 'Rust', hex: '#A24A2A' },
  { name: 'Cocoa', hex: '#6B4A3A' },
  { name: 'Denim', hex: '#4A6FA5' },
  { name: 'Sky', hex: '#BFD9F2' },
  { name: 'Plum', hex: '#6B3E66' },
  { name: 'Lilac', hex: '#B9A3D9' },
  { name: 'Coral', hex: '#F28C6F' },
  { name: 'Teal', hex: '#2F8F8A' },
  { name: 'Snow', hex: '#F7F4EE' },
  { name: 'Silver', hex: '#BDBAB4' },
  { name: 'Ink', hex: '#1F2430' },
];
const MATERIALS = ['Wool', 'Merino', 'Cotton', 'Alpaca', 'Acrylic', 'Blend'];
const NEEDLES = ['2.5 mm', '3 mm', '3.5 mm', '4 mm', '4.5 mm', '5 mm', '6 mm'];

export default function NewYarnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addYarn = useProjects((s) => s.addYarn);
  const [colour, setColour] = useState(2);
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [material, setMaterial] = useState('');
  const [needles, setNeedles] = useState<string[]>([]);

  const selected = YARN_COLOURS[colour];
  const visible = expanded ? YARN_COLOURS : YARN_COLOURS.slice(0, 12);
  const canSave = material.trim().length > 0;

  const save = () => {
    addYarn({ name: name.trim(), colorName: selected.name, hex: selected.hex, material: material.trim(), needles });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.two }]}>
        <ScreenHeader back="close" />
        <ThemedText type="title">New yarn ball</ThemedText>

        <View style={styles.preview}>
          <YarnBall color={selected.hex} size={84} id="new-yarn-preview" />
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText type="note">{selected.name.toLowerCase()}</ThemedText>
            <ThemedText type="small" numberOfLines={1}>
              {(name.trim() || 'Unnamed yarn') + (material.trim() ? ` · ${material.trim()}` : '')}
            </ThemedText>
          </View>
        </View>

        <TextField
          label="Name · optional"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Drops Merino Extra Fine"
        />

        <View style={{ gap: 10 }}>
          <View style={styles.labelRow}>
            <ThemedText type="eyebrow" themeColor="textSecondary">COLOUR</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
              {visible.length} of {YARN_COLOURS.length}
            </ThemedText>
          </View>
          <View style={styles.swatches}>
            {visible.map((c, i) => (
              <Pressable
                key={c.hex}
                accessibilityRole="button"
                accessibilityLabel={c.name}
                accessibilityState={{ selected: i === colour }}
                onPress={() => setColour(i)}
                style={[styles.swatchRing, i === colour && { borderColor: C.text }]}>
                <View style={[styles.swatch, { backgroundColor: c.hex }]} />
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            onPress={() => setExpanded(!expanded)}
            style={styles.more}>
            <Text style={styles.moreText}>{expanded ? 'Fewer colours' : 'More colours'}</Text>
            <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
              <Icon name="chevronDown" size={16} color={C.text} strokeWidth={2} />
            </View>
          </Pressable>
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
      </ScrollView>

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
  content: { paddingHorizontal: Spacing.four, paddingBottom: 32, gap: 22 },
  preview: { padding: 14, paddingHorizontal: 16, borderRadius: 22, backgroundColor: C.beige, flexDirection: 'row', alignItems: 'center', gap: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  swatchRing: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: 'rgba(28, 26, 23, 0.15)' },
  more: { alignSelf: 'center', minHeight: 44, paddingHorizontal: 18, borderRadius: 22, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', gap: 6 },
  moreText: { fontFamily: Fonts.semibold, fontSize: 14, color: C.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface, justifyContent: 'center' },
  chipText: { fontFamily: Fonts.semibold, fontSize: 14, color: C.text },
  footer: { paddingHorizontal: Spacing.four, paddingTop: 14, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
});
