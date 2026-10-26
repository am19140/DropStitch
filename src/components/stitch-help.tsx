import { createContext, useContext, useState, type ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';

import { Icon } from '@/components/icon';
import { Purl } from '@/components/purl';
import { Colors, Fonts } from '@/constants/theme';
import { stitchByKey, stitchesIn, stitchMatches } from '@/lib/stitches';
import { useProjects } from '@/store/projects';

const C = Colors.light;

/**
 * Stitch help on the counter (beginner friendly): the stitch words in the row are softly marked, and
 * under it Mrs Purl hands you a chip per stitch. Tap one and she explains it in her own words.
 * Only inside the provider, and only while "Stitch help" is on in Settings.
 */
const HelpContext = createContext<{ on: boolean; open: string | null; setOpen: (key: string | null) => void }>({
  on: false,
  open: null,
  setOpen: () => {},
});

export function StitchHelpProvider({ children }: { children: ReactNode }) {
  const on = useProjects((s) => s.stitchHelp);
  const [open, setOpen] = useState<string | null>(null);
  return <HelpContext.Provider value={{ on, open, setOpen }}>{children}</HelpContext.Provider>;
}

/** Row text with its stitch words softly marked (the one Mrs Purl is explaining, in ink). */
export function StitchText({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  const { on, open } = useContext(HelpContext);
  const matches = on ? stitchMatches(text) : [];
  if (!matches.length) return <Text style={style}>{text}</Text>;
  const parts: ReactNode[] = [];
  let at = 0;
  matches.forEach((m, i) => {
    if (m.start > at) parts.push(text.slice(at, m.start));
    parts.push(
      <Text key={i} style={[styles.mark, m.key === open && styles.markOpen]}>
        {text.slice(m.start, m.end)}
      </Text>
    );
    at = m.end;
  });
  if (at < text.length) parts.push(text.slice(at));
  return <Text style={style}>{parts}</Text>;
}

/** Mrs Purl's head, then a speech-bubble chip per stitch; tapping one opens her explanation. */
export function StitchChips({ texts }: { texts: (string | undefined)[] }) {
  const { on, open, setOpen } = useContext(HelpContext);
  const stitches = on ? stitchesIn(texts) : [];
  if (!stitches.length) return null;
  const shown = open ? stitchByKey(open) : undefined;
  const opened = shown && stitches.includes(shown) ? shown : undefined;

  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        <Purl pose="head" size={32} />
        {stitches.map((s) => {
          const isOpen = s === opened;
          return (
            <Pressable
              key={s.key}
              accessibilityRole="button"
              accessibilityLabel={`${s.label}, ${s.name}. Mrs Purl explains.`}
              accessibilityState={{ expanded: isOpen }}
              onPress={() => setOpen(isOpen ? null : s.key)}
              hitSlop={4}
              style={[styles.chip, isOpen && styles.chipOpen]}>
              <Text style={[styles.chipText, isOpen && { color: C.surface }]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {opened && (
        <View style={styles.says} accessibilityLiveRegion="polite">
          <Text style={styles.saysText}>
            <Text style={styles.saysName}>{opened.name.charAt(0).toUpperCase() + opened.name.slice(1)}. </Text>
            {opened.says}
          </Text>
          {opened.video ? (
            <Pressable accessibilityRole="button" onPress={() => Linking.openURL(opened.video!)} style={styles.showMe}>
              <Icon name="play" size={13} color={C.surface} strokeWidth={2.6} />
              <Text style={styles.showMeText}>Show me</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Pale banana alone is too faint on the cream card, so the words also get a dotted underline.
  mark: {
    backgroundColor: C.beige,
    color: C.text,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: C.textSecondary,
  },
  markOpen: { backgroundColor: C.text, color: C.surface, textDecorationLine: 'none' },
  wrap: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  // One square corner, like a speech bubble pointing back at Mrs Purl.
  chip: {
    minHeight: 34,
    paddingHorizontal: 13,
    justifyContent: 'center',
    borderRadius: 17,
    borderBottomLeftRadius: 3,
    backgroundColor: C.beige,
  },
  chipOpen: { backgroundColor: C.text },
  chipText: { fontFamily: Fonts.extrabold, fontSize: 14, color: C.text },
  says: { padding: 14, borderRadius: 18, borderBottomLeftRadius: 3, backgroundColor: C.beige, gap: 10 },
  saysText: { fontFamily: Fonts.semibold, fontSize: 15, lineHeight: 22, color: C.text },
  saysName: { fontFamily: Fonts.extrabold },
  showMe: {
    alignSelf: 'flex-start',
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: C.text,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  showMeText: { fontFamily: Fonts.extrabold, fontSize: 13.5, color: C.surface },
});
