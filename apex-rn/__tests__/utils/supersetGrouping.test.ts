import { groupExercises } from '../../src/utils/supersetGrouping';

describe('groupExercises', () => {
  it('groups consecutive exercises with same supersetGroup', () => {
    const exercises = [
      { supersetGroup: undefined },
      { supersetGroup: 'ss1' },
      { supersetGroup: 'ss1' },
      { supersetGroup: undefined },
    ];
    const groups = groupExercises(exercises);
    expect(groups).toHaveLength(3);
    expect(groups[0].type).toBe('standalone');
    expect(groups[1].type).toBe('superset');
    if (groups[1].type === 'superset') {
      expect(groups[1].items).toHaveLength(2);
      expect(groups[1].groupId).toBe('ss1');
    }
    expect(groups[2].type).toBe('standalone');
  });

  it('handles all standalone exercises', () => {
    const exercises = [
      { supersetGroup: undefined },
      { supersetGroup: undefined },
    ];
    const groups = groupExercises(exercises);
    expect(groups).toHaveLength(2);
    expect(groups.every(g => g.type === 'standalone')).toBe(true);
  });

  it('handles tri-set (3 consecutive exercises)', () => {
    const exercises = [
      { supersetGroup: 'tri1' },
      { supersetGroup: 'tri1' },
      { supersetGroup: 'tri1' },
    ];
    const groups = groupExercises(exercises);
    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBe('superset');
    if (groups[0].type === 'superset') {
      expect(groups[0].items).toHaveLength(3);
    }
  });

  it('preserves original indices', () => {
    const exercises = [
      { supersetGroup: undefined },
      { supersetGroup: 'ss1' },
      { supersetGroup: 'ss1' },
    ];
    const groups = groupExercises(exercises);
    if (groups[1].type === 'superset') {
      expect(groups[1].items[0].index).toBe(1);
      expect(groups[1].items[1].index).toBe(2);
    }
  });

  it('handles empty array', () => {
    expect(groupExercises([])).toEqual([]);
  });
});
