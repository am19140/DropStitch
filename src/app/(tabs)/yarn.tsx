import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { useConfirm } from '@/components/confirm-dialog';
import { WaveBand } from '@/components/wave-band';
import { YarnBall } from '@/components/yarn-ball';
import { Colors, Fonts } from '@/constants/theme';
import { useProjects, type Yarn } from '@/store/projects';

const C = Colors.light;

/** The little pile of yarn in the header: your own yarns' colours, or the app's when the stash is empty. */
function pileOf(yarns: Yarn[]) {
  const fallback = [
    { hex: C.primary, appearance: 'chunky' as const },
    { hex: C.red, appearance: 'smooth' as const },
    { hex: C.beige, appearance: 'fine' as const },
  ];
  return [0, 1, 2].map((i) => {
    const y = yarns[i];
    return y ? { hex: y.hex, appearance: y.appearance ?? 'smooth' } : fallback[i];
  });
}

export default function YarnScreen() {
  const router = useRouter();
  const yarns = useProjects((s) => s.yarns);
  const deleteYarn = useProjects((s) => s.deleteYarn);
  const { ask, dialog } = useConfirm();
  const remove = async (yarn: Yarn) => {
    const title = yarn.name.trim() || yarn.colorName;
    if (await ask({ title: 'Remove yarn?', message: `“${title}” will be removed from your stash.`, confirmLabel: 'Remove' })) {
      deleteYarn(yarn.id);
    }
  };
  const pairs: (Yarn | null)[][] = [];
  for (let i = 0; i < yarns.length; i += 2) pairs.push([yarns[i], yarns[i + 1] ?? null]);
  const pile = pileOf(yarns);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <WaveBand
          style={{ paddingBottom: 34 }}
          art={
            <View style={styles.pile}>
              <YarnBall color={pile[2].hex} appearance={pile[2].appearance} size={92} style={{ position: 'absolute', right: 108, bottom: 2 }} />
              <YarnBall color={pile[1].hex} appearance={pile[1].appearance} size={104} style={{ position: 'absolute', right: 0, bottom: 0 }} />
              <YarnBall color={pile[0].hex} appearance={pile[0].appearance} size={118} style={{ position: 'absolute', right: 40, bottom: 34 }} />
            </View>
          }
          artStyle={{ right: 14, bottom: 6 }}>
          <Text style={styles.title}>Your{'\n'}yarn</Text>
          <Text style={styles.subtitle}>
            {yarns.length === 0
              ? 'Nothing in your stash yet'
              : `${yarns.length} ${yarns.length === 1 ? 'ball' : 'balls'} in your stash`}
          </Text>
        </WaveBand>

        <View style={styles.content}>
          <View style={styles.grid}>
            {pairs.map((pair, i) => (
              <View key={i} style={styles.gridRow}>
                {pair.map((y, j) =>
                  y ? <YarnCard key={y.id} yarn={y} onRemove={() => remove(y)} /> : <View key={j} style={{ flex: 1 }} />
                )}
              </View>
            ))}
          </View>

          <Button
            label="Add a yarn ball"
            icon="add"
            size="large"
            onPress={() => router.push('/yarn/new')}
            style={{ marginTop: 24 }}
          />
          {yarns.length > 0 && <Text style={styles.hint}>Long-press a yarn to remove it.</Text>}
        </View>
      </ScrollView>
      {dialog}
    </View>
  );
}

function YarnCard({ yarn, onRemove }: { yarn: Yarn; onRemove: () => void }) {
  const title = yarn.name.trim() || yarn.colorName;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${yarn.colorName}, ${yarn.material}`}
      accessibilityHint="Long press to remove from your stash"
      onLongPress={onRemove}
      style={styles.card}>
      <YarnBall color={yarn.hex} appearance={yarn.appearance} size={96} style={styles.ball} />
      <Text style={styles.cardTitle} numberOfLines={2}>
        {title}
      </Text>
      {yarn.name.trim() ? <Text style={styles.muted}>{yarn.colorName}</Text> : null}
      <Text style={styles.muted} numberOfLines={2}>
        {yarn.material}
      </Text>
      {yarn.needles.length > 0 ? (
        <View style={styles.chips}>
          {yarn.needles.map((n) => (
            <View key={n} style={styles.chip}>
              <Text style={styles.chipText}>{n}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 24 },
  title: { marginTop: 18, fontFamily: Fonts.display, fontSize: 34, lineHeight: 38, color: C.text },
  subtitle: { marginTop: 8, fontFamily: Fonts.semibold, fontSize: 14.5, color: C.text, opacity: 0.75 },
  pile: { width: 210, height: 150 },
  grid: { marginTop: 4, gap: 14 },
  gridRow: { flexDirection: 'row', gap: 14 },
  card: { flex: 1, padding: 14, paddingTop: 8, borderRadius: 22, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardLine, gap: 2 },
  ball: { marginLeft: -8, marginBottom: 2 },
  cardTitle: { fontFamily: Fonts.extrabold, fontSize: 16, lineHeight: 20, color: C.text },
  muted: { fontFamily: Fonts.semibold, fontSize: 13.5, color: C.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, backgroundColor: C.skySoft },
  chipText: { fontFamily: Fonts.bold, fontSize: 12, color: C.text },
  hint: { marginTop: 12, textAlign: 'center', fontFamily: Fonts.semibold, fontSize: 13, color: C.textSecondary },
});
