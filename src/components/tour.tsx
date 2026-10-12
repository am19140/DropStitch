import { useIsFocused } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';

import { Purl } from '@/components/purl';
import { CardShadow, Colors, Fonts } from '@/constants/theme';
import { useProjects } from '@/store/projects';

const C = Colors.light;

/**
 * A guide that runs on top of the real app: everything is dimmed except one thing at a time, which
 * Mrs Purl explains in a bubble. Only Next and Skip can be tapped while it's showing. Each guide shows
 * once per phone (see `seenTours` in the store) and can be shown again from the profile.
 *
 * Mark things to point at with <TourTarget id="…">, then put <Tour id="…" steps={…} /> on the screen.
 */

type Box = { x: number; y: number; width: number; height: number };
type Measurable = View & { measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) => void };

const TargetsContext = createContext<Map<string, Measurable>>(new Map());

export function TourProvider({ children }: { children: ReactNode }) {
  const targets = useMemo(() => new Map<string, Measurable>(), []);
  return <TargetsContext.Provider value={targets}>{children}</TargetsContext.Provider>;
}

/** Wraps something the guide can point at. */
export function TourTarget({ id, children, style }: { id: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const targets = useContext(TargetsContext);
  const ref = useCallback(
    (view: View | null) => {
      if (view) targets.set(id, view as Measurable);
      else targets.delete(id);
    },
    [id, targets]
  );
  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}

export type TourStep = { target: string; title: string; text: string };

function measure(view: Measurable | undefined) {
  return new Promise<Box | null>((resolve) => {
    if (!view?.measureInWindow) return resolve(null);
    view.measureInWindow((x, y, width, height) => resolve(width && height ? { x, y, width, height } : null));
  });
}

const PAD = 8;
// The browser draws a focus box around the first button when the guide opens; it isn't needed here.
const noFocusBox = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as unknown as ViewStyle;

/** Shows the guide `id` the first time this screen is open, once `ready` is true. Keep `steps` a constant. */
export function Tour({ id, steps, ready = true }: { id: string; steps: TourStep[]; ready?: boolean }) {
  const seen = useProjects((s) => !!s.seenTours[id]);
  const markSeen = useProjects((s) => s.markTourSeen);
  const focused = useIsFocused();
  const targets = useContext(TargetsContext);
  const window = useWindowDimensions();
  const [index, setIndex] = useState<number | null>(null);
  const [box, setBox] = useState<Box | null>(null);

  // Start a moment after the screen settles, so everything has its final size and place.
  useEffect(() => {
    if (seen || !focused || !ready) return;
    const timer = setTimeout(() => setIndex(0), 700);
    return () => clearTimeout(timer);
  }, [seen, focused, ready]);

  // Find the current step's target; steps whose target isn't on screen are skipped.
  useEffect(() => {
    if (index === null) return;
    let cancelled = false;
    (async () => {
      for (let i = index; i < steps.length; i++) {
        const found = await measure(targets.get(steps[i].target));
        if (cancelled) return;
        if (found && found.y < window.height && found.y + found.height > 0) {
          if (i !== index) setIndex(i);
          setBox(found);
          return;
        }
      }
      markSeen(id);
      setIndex(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [index, id, markSeen, steps, targets, window.height]);

  if (index === null || !box || seen) return null;
  const step = steps[index];
  const last = index === steps.length - 1;
  const finish = () => {
    markSeen(id);
    setIndex(null);
    setBox(null);
  };

  // The lit-up hole, a little bigger than the target and kept on screen.
  const hole = {
    x: Math.max(4, box.x - PAD),
    y: Math.max(4, box.y - PAD),
    width: Math.min(window.width - 8, box.width + PAD * 2),
    height: box.height + PAD * 2,
  };
  const below = hole.y + hole.height + 230 < window.height;
  const bubbleTop = below ? hole.y + hole.height + 14 : undefined;
  const bubbleBottom = below ? undefined : window.height - hole.y + 14;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={finish}>
      {/* A full-screen layer takes every touch, so the app underneath can't be used; only Next and Skip work. */}
      <View style={StyleSheet.absoluteFill}>
        {/* The spotlight: a rounded hole whose huge shadow darkens everything around it. */}
        <View
          pointerEvents="none"
          style={[
            styles.spotlight,
            {
              left: hole.x,
              top: hole.y,
              width: hole.width,
              height: hole.height,
              // Round things (like the + button) get a round spotlight.
              borderRadius: Math.abs(hole.width - hole.height) < 12 ? hole.width / 2 : Math.min(26, hole.height / 2),
            },
          ]}
        />

        <View style={[styles.bubble, CardShadow, { top: bubbleTop, bottom: bubbleBottom }]}>
          <View style={styles.bubbleTop}>
            <Purl pose="head" size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.count}>
                {index + 1} of {steps.length}
              </Text>
              <Text style={styles.title}>{step.title}</Text>
            </View>
          </View>
          <Text style={styles.text}>{step.text}</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={finish} style={[styles.skip, noFocusBox]}>
              <Text style={styles.skipText}>{last ? '' : 'Skip'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => (last ? finish() : setIndex(index + 1))}
              style={({ pressed }) => [styles.next, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
              <Text style={styles.nextText}>{last ? 'Let’s knit!' : 'Next →'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  spotlight: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: C.surface,
    boxShadow: '0 0 0 2000px rgba(28, 26, 23, 0.62)',
  },
  bubble: { position: 'absolute', left: 16, right: 16, padding: 18, borderRadius: 24, backgroundColor: C.surface, gap: 10 },
  bubbleTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  count: { fontFamily: Fonts.bold, fontSize: 12.5, color: C.textSecondary },
  title: { fontFamily: Fonts.display, fontSize: 20, lineHeight: 24, color: C.text },
  text: { fontFamily: Fonts.semibold, fontSize: 15, lineHeight: 22, color: C.textSecondary },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  skip: { minHeight: 44, minWidth: 60, justifyContent: 'center' },
  skipText: { fontFamily: Fonts.bold, fontSize: 15, color: C.textSecondary },
  next: { minHeight: 46, paddingHorizontal: 22, borderRadius: 999, backgroundColor: C.text, justifyContent: 'center' },
  nextText: { fontFamily: Fonts.extrabold, fontSize: 15.5, color: C.surface },
});
