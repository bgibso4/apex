/**
 * APEX -- Program Completion Celebration
 *
 * Full-screen dark takeover shown the instant a user finishes the final
 * workout of a program. Replicates the locked mockup
 * (docs/mockups/program-complete-celebration-2026-06-07.html):
 *   - firework burst (sparks + central flash + expanding shockwave ring)
 *   - a trophy core that stamps in with a rotate overshoot
 *   - eyebrow / program name / stat line
 *   - a Continue button
 * Fires a success haptic on mount.
 */

import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';

export interface ProgramCompletionCelebrationProps {
  programName: string;
  weeks: number;
  sessions: number;
  prs: number;
  onContinue: () => void;
}

/** Radius of the firework field (px). Sparks travel out to their vectors. */
const FIELD = 300;

/** Spark color roles, mapped to semantic tokens. */
const GOLD = Colors.amber; // mockup #f0b429 -> amber accent
const INDIGO = Colors.indigo; // mockup #6366f1 -> exact
const WHITE = Colors.text; // mockup #fff
const DIM = Colors.textSecondary; // mockup #a9a9b3 (secondary sparks)

interface SparkDef {
  tx: number;
  ty: number;
  color: string;
  size: number;
  delay: number;
}

// Primary 12 sparks radiate along the locked vectors; the secondary 4 are
// smaller, dimmer, and arrive later -- mirrors the mockup exactly.
const SPARKS: SparkDef[] = [
  { tx: 115, ty: 0, color: GOLD, size: 7, delay: 0 },
  { tx: 99, ty: 58, color: INDIGO, size: 7, delay: 50 },
  { tx: 58, ty: 99, color: WHITE, size: 7, delay: 100 },
  { tx: 0, ty: 115, color: GOLD, size: 7, delay: 0 },
  { tx: -58, ty: 99, color: INDIGO, size: 7, delay: 80 },
  { tx: -99, ty: 58, color: WHITE, size: 7, delay: 120 },
  { tx: -115, ty: 0, color: GOLD, size: 7, delay: 40 },
  { tx: -99, ty: -58, color: INDIGO, size: 7, delay: 100 },
  { tx: -58, ty: -99, color: WHITE, size: 7, delay: 0 },
  { tx: 0, ty: -115, color: GOLD, size: 7, delay: 60 },
  { tx: 58, ty: -99, color: INDIGO, size: 7, delay: 110 },
  { tx: 99, ty: -58, color: WHITE, size: 7, delay: 30 },
  // secondary, smaller + dimmer
  { tx: 70, ty: 40, color: DIM, size: 4, delay: 500 },
  { tx: -70, ty: 40, color: DIM, size: 4, delay: 550 },
  { tx: 0, ty: -80, color: DIM, size: 4, delay: 600 },
  { tx: 0, ty: 80, color: DIM, size: 4, delay: 520 },
];

/** Total time for one spark's travel (ms). */
const SPARK_DURATION = 1100;

function Spark({ tx, ty, color, size, delay }: SparkDef) {
  const progress = useSharedValue(0); // 0 = center, 1 = full vector
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.2);

  useEffect(() => {
    // Travel: quick burst to ~35% then ease out to full vector.
    progress.value = withDelay(
      delay,
      withSequence(
        withTiming(0.35, { duration: SPARK_DURATION * 0.12, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: SPARK_DURATION * 0.88, easing: Easing.out(Easing.cubic) })
      )
    );
    // Pop in, hold, then fade as it reaches the edge.
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: SPARK_DURATION * 0.08 }),
        withTiming(0.9, { duration: SPARK_DURATION * 0.7 }),
        withTiming(0, { duration: SPARK_DURATION * 0.22 })
      )
    );
    // Scale up on the burst, shrink slightly as it travels out.
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: SPARK_DURATION * 0.12 }),
        withTiming(0.35, { duration: SPARK_DURATION * 0.88 })
      )
    );
  }, [progress, opacity, scale, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: tx * progress.value },
      { translateY: ty * progress.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.spark,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          marginLeft: -size / 2,
          marginTop: -size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export function ProgramCompletionCelebration({
  programName,
  weeks,
  sessions,
  prs,
  onContinue,
}: ProgramCompletionCelebrationProps) {
  // Trophy stamp-in
  const trophyScale = useSharedValue(0);
  const trophyRotate = useSharedValue(-20);
  // Central white flash
  const flashScale = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  // Expanding indigo shockwave ring
  const shockScale = useSharedValue(0.3);
  const shockOpacity = useSharedValue(0);

  useEffect(() => {
    // Success haptic the instant the celebration appears.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );

    // Flash: snap in, scale up, fade out.
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 60 }),
      withTiming(0.9, { duration: 100 }),
      withTiming(0, { duration: 240 })
    );
    flashScale.value = withTiming(2.6, {
      duration: 360,
      easing: Easing.out(Easing.quad),
    });

    // Shockwave: expand outward and fade.
    shockOpacity.value = withDelay(
      40,
      withSequence(
        withTiming(0.7, { duration: 80 }),
        withTiming(0, { duration: 520 })
      )
    );
    shockScale.value = withDelay(
      40,
      withTiming(5.5, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    // Trophy stamp: scale 0 -> 1.1 (overshoot, rotate +3) -> settle to 1, 0deg.
    trophyScale.value = withDelay(
      120,
      withSequence(
        withTiming(1.1, { duration: 260, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 180 })
      )
    );
    trophyRotate.value = withDelay(
      120,
      withSequence(
        withTiming(3, { duration: 260 }),
        withTiming(0, { duration: 180 })
      )
    );
  }, [
    flashOpacity,
    flashScale,
    shockOpacity,
    shockScale,
    trophyScale,
    trophyRotate,
  ]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    transform: [{ scale: flashScale.value }],
  }));

  const shockStyle = useAnimatedStyle(() => ({
    opacity: shockOpacity.value,
    transform: [{ scale: shockScale.value }],
  }));

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: trophyScale.value },
      { rotate: `${trophyRotate.value}deg` },
    ],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Firework field: flash + shockwave + sparks behind the trophy core */}
        <View style={styles.field}>
          <Animated.View
            pointerEvents="none"
            style={[styles.flash, flashStyle]}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.shock, shockStyle]}
          />
          {SPARKS.map((s, i) => (
            <Spark key={i} {...s} />
          ))}
          <Animated.View style={[styles.trophyCore, trophyStyle]}>
            <Text style={styles.trophyGlyph}>🏆</Text>
          </Animated.View>
        </View>

        <Animated.Text
          entering={FadeInUp.delay(360).duration(400)}
          style={styles.eyebrow}
        >
          PROGRAM COMPLETE
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(440).duration(400)}
          style={styles.pname}
        >
          {programName}
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(520).duration(400)}
          style={styles.psub}
        >
          {weeks} weeks · {sessions} sessions · {prs} PRs
        </Animated.Text>
      </View>

      <Animated.View
        entering={FadeIn.delay(700).duration(400)}
        style={styles.footer}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onContinue}
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed,
          ]}
        >
          <Text style={styles.continueLabel}>Continue</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const TROPHY_CORE = 150;
const FLASH_BASE = 22;
const SHOCK_BASE = 36;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenHorizontal,
    zIndex: 100,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    width: FIELD,
    height: FIELD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: {
    position: 'absolute',
    left: '50%',
    top: '50%',
  },
  flash: {
    position: 'absolute',
    width: FLASH_BASE,
    height: FLASH_BASE,
    borderRadius: FLASH_BASE / 2,
    backgroundColor: WHITE,
    shadowColor: WHITE,
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  shock: {
    position: 'absolute',
    width: SHOCK_BASE,
    height: SHOCK_BASE,
    borderRadius: SHOCK_BASE / 2,
    borderWidth: 1,
    borderColor: Colors.indigoBorderFaint,
  },
  trophyCore: {
    width: TROPHY_CORE,
    height: TROPHY_CORE,
    borderRadius: TROPHY_CORE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardHover,
    borderWidth: 2,
    borderColor: Colors.amber,
    shadowColor: Colors.amber,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  trophyGlyph: {
    fontSize: 62,
  },
  eyebrow: {
    fontSize: FontSize.body,
    letterSpacing: 4,
    color: Colors.textDim,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  pname: {
    fontSize: FontSize.screenTitle,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.lg,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  psub: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  footer: {
    width: '100%',
    paddingBottom: Spacing.screenBottom,
  },
  continueButton: {
    width: '100%',
    height: 54,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.indigo,
  },
  continueButtonPressed: {
    backgroundColor: Colors.indigoDark,
  },
  continueLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
});
