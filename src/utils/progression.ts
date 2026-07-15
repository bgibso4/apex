/**
 * APEX — RPE auto-progression decision logic (issue #45)
 * Pure functions; all DB access stays in the callers.
 * Spec: docs/plans/2026-07-13-rpe-auto-progression-design.md
 */

export function getMostCommonWeight(
  sets: { actual_weight?: number | null }[]
): number | undefined {
  const weights = sets.map(s => s.actual_weight).filter((w): w is number => w != null && w > 0);
  if (weights.length === 0) return undefined;
  const counts = new Map<number, number>();
  for (const w of weights) counts.set(w, (counts.get(w) || 0) + 1);
  let best = weights[0], bestCount = 0;
  for (const [w, c] of counts) { if (c > bestCount) { best = w; bestCount = c; } }
  return best;
}

/** "7-8" → 7, "7" → 7, missing/garbage → null (null = suggestions disabled) */
export function parseRpeThreshold(rpeTarget: string | undefined | null): number | null {
  if (!rpeTarget) return null;
  const m = String(rpeTarget).match(/^\s*(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

export interface ProgressionSetInput {
  status: 'pending' | 'completed' | 'completed_below' | 'skipped';
  weight?: number;
  reps?: number;
  targetReps?: number;
}

export type ProgressionSuggestion =
  | { kind: 'increase' | 'decrease'; currentWeight: number; suggestedWeight: number }
  | null;

export function evaluateProgression(input: {
  category: string | undefined;
  rpe: number;
  rpeThreshold: number | null;
  increment: number;
  currentSets: ProgressionSetInput[];
  lastSessionSets: { status: string; actual_weight?: number | null }[];
}): ProgressionSuggestion {
  const { category, rpe, rpeThreshold, increment, currentSets, lastSessionSets } = input;
  if (category !== 'accessory') return null;
  if (rpeThreshold == null) return null; // deload / no accessory scheme → silent

  const currentWeight = getMostCommonWeight(currentSets.map(s => ({ actual_weight: s.weight })));
  if (!currentWeight) return null;

  // Increase: every prescribed set completed at/above target reps, RPE at/below threshold
  if (rpe <= rpeThreshold) {
    const allHit = currentSets.length > 0 && currentSets.every(s =>
      s.status === 'completed' && (s.targetReps == null || (s.reps ?? 0) >= s.targetReps)
    );
    if (allHit) {
      return { kind: 'increase', currentWeight, suggestedWeight: currentWeight + increment };
    }
  }

  // Decrease: missed reps this session AND last session, at the same weight
  const missedNow = currentSets.some(s => s.status === 'completed_below');
  if (missedNow) {
    const missedLast = lastSessionSets.some(s => s.status === 'completed_below');
    const lastWeight = getMostCommonWeight(lastSessionSets);
    if (missedLast && lastWeight === currentWeight) {
      const suggestedWeight = currentWeight - increment;
      if (suggestedWeight > 0) return { kind: 'decrease', currentWeight, suggestedWeight };
    }
  }

  return null;
}

/**
 * Pre-fill weight resolution:
 * %1RM → un-trained accepted adjustment → last session's modal weight → program default → 0.
 * An adjustment counts as "un-trained" while the session it was accepted in is still the
 * most recent completed session containing the exercise; any newer completed session
 * supersedes it, which is what makes manual edits always win.
 */
export function resolveWorkingWeight(params: {
  percentWeight: number;
  adjustment: { new_weight: number; session_id: string } | null;
  lastSets: { session_id: string; actual_weight?: number | null }[];
  defaultWeight?: number;
}): number {
  const { percentWeight, adjustment, lastSets, defaultWeight } = params;
  if (percentWeight) return percentWeight;
  const lastSessionId = lastSets[0]?.session_id;
  if (adjustment && (lastSessionId == null || adjustment.session_id === lastSessionId)) {
    return adjustment.new_weight;
  }
  return getMostCommonWeight(lastSets) ?? defaultWeight ?? 0;
}
