import { getDeltaExcludingDeload } from '../../src/utils/deltaCalculation';

describe('getDeltaExcludingDeload', () => {
  it('returns null for fewer than 2 non-deload points', () => {
    expect(getDeltaExcludingDeload([])).toBeNull();
    expect(getDeltaExcludingDeload([{ e1rm: 300, blockName: 'Deload' }])).toBeNull();
    expect(getDeltaExcludingDeload([{ e1rm: 300, blockName: 'Strength' }])).toBeNull();
  });

  it('computes delta between first and last non-deload points', () => {
    const history = [
      { e1rm: 280, blockName: 'Hypertrophy' },
      { e1rm: 290, blockName: 'Hypertrophy' },
      { e1rm: 200, blockName: 'Deload' },
      { e1rm: 310, blockName: 'Strength' },
    ];
    expect(getDeltaExcludingDeload(history)).toBe(30);
  });

  it('ignores trailing deload points', () => {
    const history = [
      { e1rm: 280, blockName: 'Strength' },
      { e1rm: 300, blockName: 'Strength' },
      { e1rm: 150, blockName: 'Deload' },
    ];
    expect(getDeltaExcludingDeload(history)).toBe(20);
  });

  it('works with no deload points at all', () => {
    const history = [
      { e1rm: 250, blockName: 'Hypertrophy' },
      { e1rm: 275, blockName: 'Strength' },
    ];
    expect(getDeltaExcludingDeload(history)).toBe(25);
  });
});
