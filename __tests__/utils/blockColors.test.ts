/**
 * APEX — Block color map utility tests
 */

import { getBlockColorMap, getBlockColorMuted, getBlockColorOpaque } from '../../src/utils/blockColors';
import { Colors } from '../../src/theme/colors';
import type { Block } from '../../src/types';

function makeBlock(name: string, weeks: number[] = [1]): Block {
  return {
    name,
    weeks,
    main_lift_scheme: {},
  };
}

describe('getBlockColorMap', () => {
  it('returns empty map for empty blocks array', () => {
    expect(getBlockColorMap([])).toEqual({});
  });

  it('assigns green to deload blocks', () => {
    const blocks = [makeBlock('Deload')];
    const map = getBlockColorMap(blocks);
    expect(map['Deload']).toBe(Colors.deload);
  });

  it('assigns hypertrophy color to hypertrophy blocks', () => {
    const blocks = [makeBlock('Hypertrophy')];
    const map = getBlockColorMap(blocks);
    expect(map['Hypertrophy']).toBe(Colors.hypertrophy);
  });

  it('assigns hypertrophy color to work capacity blocks', () => {
    const blocks = [makeBlock('Work Capacity')];
    const map = getBlockColorMap(blocks);
    expect(map['Work Capacity']).toBe(Colors.hypertrophy);
  });

  it('assigns strength color to strength blocks', () => {
    const blocks = [makeBlock('Strength')];
    const map = getBlockColorMap(blocks);
    expect(map['Strength']).toBe(Colors.strength);
  });

  it('assigns realization color to realization blocks', () => {
    const blocks = [makeBlock('Realization')];
    const map = getBlockColorMap(blocks);
    expect(map['Realization']).toBe(Colors.realization);
  });

  it('assigns realization color to peak blocks', () => {
    const blocks = [makeBlock('Peak')];
    const map = getBlockColorMap(blocks);
    expect(map['Peak']).toBe(Colors.realization);
  });

  it('assigns colors from palette for unknown blocks', () => {
    const blocks = [
      makeBlock('Phase A'),
      makeBlock('Phase B'),
      makeBlock('Phase C'),
    ];
    const map = getBlockColorMap(blocks);

    // Each unknown block gets a different color from the palette
    const colors = [map['Phase A'], map['Phase B'], map['Phase C']];
    expect(new Set(colors).size).toBe(3);
  });

  it('deduplicates: same block name always gets same color', () => {
    const blocks = [
      makeBlock('Hypertrophy', [1, 2]),
      makeBlock('Strength', [3, 4]),
      makeBlock('Hypertrophy', [5, 6]),
    ];
    const map = getBlockColorMap(blocks);
    // Only two entries, not three
    expect(Object.keys(map)).toHaveLength(2);
    expect(map['Hypertrophy']).toBe(Colors.hypertrophy);
    expect(map['Strength']).toBe(Colors.strength);
  });

  it('handles mix of known and unknown blocks', () => {
    const blocks = [
      makeBlock('Hypertrophy'),
      makeBlock('Custom Phase'),
      makeBlock('Deload'),
    ];
    const map = getBlockColorMap(blocks);
    expect(map['Hypertrophy']).toBe(Colors.hypertrophy);
    expect(map['Deload']).toBe(Colors.deload);
    // Custom gets first palette color
    expect(map['Custom Phase']).toBe(Colors.indigo);
  });

  it('is case-insensitive for known patterns', () => {
    const blocks = [makeBlock('DELOAD'), makeBlock('hypertrophy')];
    const map = getBlockColorMap(blocks);
    expect(map['DELOAD']).toBe(Colors.deload);
    expect(map['hypertrophy']).toBe(Colors.hypertrophy);
  });
});

describe('getBlockColorMuted', () => {
  it('appends 18 hex opacity to color', () => {
    expect(getBlockColorMuted('#6366f1')).toBe('#6366f118');
    expect(getBlockColorMuted('#22c55e')).toBe('#22c55e18');
  });
});

describe('getBlockColorOpaque', () => {
  it('strips 2-char hex opacity suffix from 9-char color', () => {
    expect(getBlockColorOpaque('#6366f118')).toBe('#6366f1');
    expect(getBlockColorOpaque('#22c55e18')).toBe('#22c55e');
  });

  it('returns short colors unchanged', () => {
    expect(getBlockColorOpaque('#6366f1')).toBe('#6366f1');
    expect(getBlockColorOpaque('#fff')).toBe('#fff');
  });
});
