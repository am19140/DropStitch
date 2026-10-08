import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { HeaderButton } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { YarnBall } from '@/components/yarn-ball';
import { CardShadow, Colors, Fonts, Spacing } from '@/constants/theme';
import { confirm } from '@/lib/confirm';
import { useProjects, type Yarn } from '@/store/projects';

const C = Colors.light;

export default function YarnScreen() {
  const router = useRouter();
  const yarns = useProjects((s) => s.yarns);
  const pairs: (Yarn | null)[][] = [];
  for (let i = 0; i < yarns.length; i += 2) pairs.push([yarns[i], yarns[i + 1] ?? null]);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View />
          <HeaderButton icon="add" label="Add a yarn ball" onPress={() => router.push('/yarn/new')} />
        </View>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <ThemedText type="title">Your yarn</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 6 }}>
              {yarns.length === 0
                ? 'Nothing in your stash yet'
                : `${yarns.length} ${yarns.length === 1 ? 'ball' : 'balls'} in your stash`}
            </ThemedText>
          </View>
          <View style={styles.art}>
            <YarnBall color={C.primary} size={96} />
          </View>
        </View>

        <View style={styles.grid}>
          {pairs.map((pair, i) => (
            <View key={i} style={styles.gridRow}>
              {pair.map((y, j) => (y ? <YarnCard key={y.id} yarn={y} /> : <View key={j} style={{ flex: 1 }} />))}
            </View>
          ))}
        </View>

        <Button
          label="Add a yarn ball"
          icon="add"
          size="large"
          onPress={() => router.push('/yarn/new')}
          style={{ marginTop: 28 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function YarnCard({ yarn }: { yarn: Yarn }) {
  const deleteYarn = useProjects((s) => s.deleteYarn);
  const title = yarn.name.trim() || yarn.colorName;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${yarn.material}`}
      accessibilityHint="Long press to remove from your stash"
      onLongPress={async () => {
        if (await confirm('Remove yarn?', `“${title}” will be removed from your stash.`, 'Remove')) {
          deleteYarn(yarn.id);
        }
      }}
      style={[styles.card, CardShadow]}>
      <View style={styles.ball}>
        <YarnBall color={yarn.hex} size={76} />
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {title}
      </Text>
      {yarn.name.trim() ? <ThemedText type="small" themeColor="textSecondary">{yarn.colorName}</ThemedText> : null}
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
        {yarn.material}
      </ThemedText>
      {yarn.needles.length > 0 ? (
        <View style={styles.chips}>
          {yarn.needles.map((n) => (
            <View key={n} style={styles.chip}>
              <Text style={styles.chipText}>{n}</Text>
            </View>
          ))}
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 8, fontSize: 12 }}>
          No needles saved
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.four, paddingTop: Spacing.three, paddingBottom: 40 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginRight: -10 },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  art: { marginTop: -4 },
  grid: { marginTop: 32, gap: 32 },
  gridRow: { flexDirection: 'row', gap: 16 },
  card: { flex: 1, paddingTop: 62, padding: 14, borderRadius: 24, backgroundColor: C.surface, gap: 3 },
  ball: { position: 'absolute', left: -8, top: -18 },
  cardTitle: { fontFamily: Fonts.semibold, fontSize: 16, color: C.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: C.sky },
  chipText: { fontFamily: Fonts.bold, fontSize: 12, color: C.text },
});
