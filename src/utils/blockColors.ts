/**
 * APEX — Block color map utility
 * Dynamically maps training block names to colors using pattern matching
 * for known block types, with a cycling palette fallback for unknown blocks.
 */

import { Colors } from '../theme/colors';
import type { Block } from '../types';

const KNOWN_PATTERNS: [RegExp, string][] = [
  [/deload/i, Colors.deload],
  [/hypertrophy|work.?capacity/i, Colors.hypertrophy],
  [/strength/i, Colors.strength],
  [/realization|peak/i, Colors.realization],
];

const PALETTE = [
  Colors.indigo,
  Colors.amber,
  Colors.cyan,
  Colors.realization,
];

/**
 * Build a map from block name -> color.
 * Known block names are matched by regex pattern; unknown blocks
 * cycle through the PALETTE in order of first appearance.
 * Same block name always gets the same color (deduplication).
 */
export function getBlockColorMap(blocks: Block[]): Record<string, string> {
  const map: Record<string, string> = {};
  let paletteIndex = 0;

  for (const block of blocks) {
    if (map[block.name] !== undefined) continue;

    const matched = KNOWN_PATTERNS.find(([re]) => re.test(block.name));
    if (matched) {
      map[block.name] = matched[1];
    } else {
      map[block.name] = PALETTE[paletteIndex % PALETTE.length];
      paletteIndex++;
    }
  }

  return map;
}

/**
 * Return a muted (low-opacity) version of a color by appending 18 hex opacity.
 */
export function getBlockColorMuted(color: string): string {
  return `${color}18`;
}
