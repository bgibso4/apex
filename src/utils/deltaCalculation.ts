/**
 * Calculate 1RM delta excluding deload sessions.
 * Compares first non-deload point to last non-deload point.
 */
export function getDeltaExcludingDeload(
  history: { e1rm: number; blockName: string }[]
): number | null {
  const nonDeload = history.filter(h => !/deload/i.test(h.blockName));
  if (nonDeload.length < 2) return null;
  return nonDeload[nonDeload.length - 1].e1rm - nonDeload[0].e1rm;
}
