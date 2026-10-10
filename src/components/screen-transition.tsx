import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet } from 'react-native';

/**
 * A screen that eases in when it opens: a short fade with a small slide from the right.
 * Phones already animate screens natively, so this only runs in the browser.
 */
export function ScreenTransition({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const animate = Platform.OS === 'web' && enabled;
  const [progress] = useState(() => new Animated.Value(animate ? 0 : 1));

  useEffect(() => {
    if (!animate) return;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduced) => {
        if (cancelled) return;
        Animated.timing(progress, {
          toValue: 1,
          duration: reduced ? 0 : 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      });
    return () => {
      cancelled = true;
    };
  }, [animate, progress]);

  if (!animate) return <>{children}</>;
  return (
    <Animated.View
      style={[
        styles.fill,
        {
          opacity: progress,
          transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
