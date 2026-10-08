import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts } from '@/constants/theme';
import { useProjects } from '@/store/projects';

const C = Colors.light;

/** First-launch poster on cobalt blue. */
export default function WelcomeScreen() {
  const router = useRouter();
  const markWelcomeSeen = useProjects((s) => s.markWelcomeSeen);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.brand}>
        <Icon name="yarn" size={20} color={C.onPrimary} strokeWidth={1.6} />
        <Text style={styles.brandText}>dropstitch</Text>
      </View>

      <View style={styles.middle}>
        <ThemedText type="eyebrow" style={styles.onBlue}>ROWS · STEPS · PATTERNS · YARN</ThemedText>
        <Text style={styles.title}>
          Never{'\n'}
          <Text style={styles.highlight}> miss </Text> a{'\n'}stitch
        </Text>
        <ThemedText type="note" style={[styles.note, styles.onBlue]}>
          your knitting, counted for you
        </ThemedText>
      </View>

      <Button
        label="Get started"
        icon="arrowRight"
        iconAfter
        variant="soft"
        size="large"
        onPress={() => {
          markWelcomeSeen();
          router.replace('/');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.primary, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontFamily: Fonts.bold, fontSize: 14, color: C.onPrimary },
  middle: { flex: 1, justifyContent: 'center' },
  title: { marginTop: 16, fontFamily: Fonts.display, fontSize: 84, lineHeight: 80, letterSpacing: -2.5, color: C.onPrimary },
  highlight: { fontFamily: Fonts.displayItalic, backgroundColor: C.red, color: C.onRed },
  note: { marginTop: 22, fontSize: 22, lineHeight: 28 },
  onBlue: { color: C.onPrimary },
});
