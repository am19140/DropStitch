import { useIsFocused, useRouter } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import PaintedKnittingGrandma from '@/components/grandma/painted-knitting-grandma';
import { WaveBand } from '@/components/wave-band';
import { YarnBall } from '@/components/yarn-ball';
import { Colors, Fonts } from '@/constants/theme';
import { useProjects } from '@/store/projects';

const C = Colors.light;

/** First launch: the name and promise on the sky-blue band, Purl knitting underneath. */
export default function WelcomeScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const markWelcomeSeen = useProjects((s) => s.markWelcomeSeen);

  return (
    <View style={styles.screen}>
      <WaveBand style={{ paddingBottom: 84 }}>
        <View style={styles.brand}>
          <YarnBall color={C.sky} size={34} />
          <Text style={styles.brandText}>dropstitch</Text>
        </View>
        <Text style={styles.eyebrow}>Rows, steps, patterns and yarn</Text>
        <Text style={styles.title}>Never miss{'\n'}a stitch</Text>
        <Text style={styles.subtitle}>Your knitting, counted for you.</Text>
      </WaveBand>

      <View style={styles.purl} pointerEvents="none">
        <PaintedKnittingGrandma paused={false} width={Math.min(width - 60, 340)} active={isFocused} />
      </View>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <Button
          label="Get started"
          icon="arrowRight"
          iconAfter
          size="large"
          onPress={() => {
            markWelcomeSeen();
            router.replace('/');
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  brand: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  brandText: { fontFamily: Fonts.display, fontSize: 20, color: C.text },
  eyebrow: { marginTop: 40, textAlign: 'center', fontFamily: Fonts.bold, fontSize: 14, color: C.text, opacity: 0.75 },
  title: { marginTop: 8, textAlign: 'center', fontFamily: Fonts.display, fontSize: 46, lineHeight: 50, color: C.text },
  subtitle: { marginTop: 12, textAlign: 'center', fontFamily: Fonts.semibold, fontSize: 16, color: C.text, opacity: 0.85 },
  purl: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', marginTop: -120 },
  bottom: { paddingHorizontal: 24 },
});
