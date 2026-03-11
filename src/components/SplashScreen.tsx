/**
 * APEX -- Branded Splash Screen
 * Shown on app launch while DB and fonts initialize.
 */

import { useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Colors, FontSize, Spacing } from '../theme';
import { APEX_FONT_FAMILY } from '../theme/fonts';

/** Transition style for the splash exit animation */
export type TransitionStyle = 'fade' | 'scale-fade' | 'crossfade';

/** Change this to swap the exit transition */
const TRANSITION_STYLE: TransitionStyle = 'scale-fade';

/** Minimum time the splash screen is visible (ms) */
const SPLASH_MIN_DURATION_MS = 1500;

/** Transition animation duration (ms) */
const TRANSITION_DURATION_MS = 400;

const CREED_LINE_1 = 'Mastery is a process, not a destination.';
const CREED_LINE_2 =
  'I am committed to the journey, knowing the path itself is the reward.';

export interface SplashScreenProps {
  /** Whether the app is ready (DB + fonts loaded) */
  isReady: boolean;
  /** Called when splash is done (min time elapsed + ready + transition complete) */
  onFinished: () => void;
}

export function SplashScreen({ isReady, onFinished }: SplashScreenProps) {
  const minTimeElapsed = useRef(false);
  const hasTriggeredExit = useRef(false);

  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const quoteOpacity = useSharedValue(1);

  const startExitAnimation = useCallback(() => {
    if (hasTriggeredExit.current) return;
    hasTriggeredExit.current = true;

    const duration = TRANSITION_DURATION_MS;

    if (TRANSITION_STYLE === 'fade') {
      opacity.value = withTiming(0, { duration });
    } else if (TRANSITION_STYLE === 'scale-fade') {
      quoteOpacity.value = withTiming(0, { duration: duration * 0.6 });
      scale.value = withTiming(0.85, { duration });
      opacity.value = withTiming(0, { duration });
    } else if (TRANSITION_STYLE === 'crossfade') {
      opacity.value = withTiming(0, { duration: duration * 1.2 });
    }

    // Call onFinished after the transition completes
    setTimeout(onFinished, duration);
  }, [onFinished, opacity, scale, quoteOpacity]);

  const tryExit = useCallback(() => {
    if (minTimeElapsed.current && isReady) {
      startExitAnimation();
    }
  }, [isReady, startExitAnimation]);

  // Minimum duration timer
  useEffect(() => {
    const timer = setTimeout(() => {
      minTimeElapsed.current = true;
      tryExit();
    }, SPLASH_MIN_DURATION_MS);
    return () => clearTimeout(timer);
  }, [tryExit]);

  // Watch for isReady changes
  useEffect(() => {
    if (isReady) {
      tryExit();
    }
  }, [isReady, tryExit]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const wordmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const quoteAnimatedStyle = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value,
  }));

  const fontFamily =
    APEX_FONT_FAMILY === 'System' ? undefined : APEX_FONT_FAMILY;

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <View style={styles.content}>
        <Animated.View style={[wordmarkAnimatedStyle, styles.wordmarkRow]}>
          <Image
            source={require('../../assets/logo-mark.png')}
            style={styles.logoMark}
            resizeMode="contain"
          />
          <Text style={[styles.wordmark, fontFamily && { fontFamily }]}>
            PEX
          </Text>
        </Animated.View>
        <Animated.View style={quoteAnimatedStyle}>
          <Text style={styles.creed}>{CREED_LINE_1}</Text>
          <Text style={styles.creed}>{CREED_LINE_2}</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg,
    zIndex: 100,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoMark: {
    width: 38,
    height: 44,
    marginRight: 2,
  },
  wordmark: {
    color: Colors.text,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 3,
  },
  creed: {
    color: Colors.textDim,
    fontSize: FontSize.md,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
  },
});
