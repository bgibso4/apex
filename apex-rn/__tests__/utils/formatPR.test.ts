import { formatPRDescription, formatPRName } from '../../src/utils/formatPR';

describe('formatPRDescription', () => {
  it('formats e1rm PR with diff', () => {
    const result = formatPRDescription({
      record_type: 'e1rm', value: 263, previous_value: 250,
      rep_count: null, exercise_name: 'Bench', exercise_id: 'bench',
    });
    expect(result).toBe('New est. 1RM: 263 lbs (+13 lbs)');
  });

  it('formats e1rm PR without previous', () => {
    const result = formatPRDescription({
      record_type: 'e1rm', value: 263, previous_value: null,
      rep_count: null, exercise_name: 'Bench', exercise_id: 'bench',
    });
    expect(result).toBe('New est. 1RM: 263 lbs');
  });

  it('formats rep_best PR', () => {
    const result = formatPRDescription({
      record_type: 'rep_best', value: 225, previous_value: null,
      rep_count: 5, exercise_name: 'Squat', exercise_id: 'squat',
    });
    expect(result).toBe('225 lbs \u00D7 5 (best at 5 reps)');
  });

  it('formats best_reps PR', () => {
    const result = formatPRDescription({
      record_type: 'best_reps', value: 12, previous_value: null,
      rep_count: null, exercise_name: 'Pushup', exercise_id: 'pushup',
    });
    expect(result).toBe('12 reps (new best)');
  });

  it('formats best_duration PR', () => {
    const result = formatPRDescription({
      record_type: 'best_duration', value: 95, previous_value: null,
      rep_count: null, exercise_name: 'Plank', exercise_id: 'plank',
    });
    expect(result).toBe('1m 35s (new best)');
  });

  it('formats best_time PR', () => {
    const result = formatPRDescription({
      record_type: 'best_time', value: 120, previous_value: null,
      rep_count: null, exercise_name: 'Erg', exercise_id: 'erg',
    });
    expect(result).toBe('2m 0s (new fastest)');
  });
});

describe('formatPRName', () => {
  it('uses exercise_name when available', () => {
    expect(formatPRName({ record_type: 'e1rm', value: 100, previous_value: null, rep_count: null, exercise_name: 'Bench Press', exercise_id: 'bench_press' }))
      .toBe('Bench Press');
  });

  it('humanizes exercise_id when no name', () => {
    expect(formatPRName({ record_type: 'e1rm', value: 100, previous_value: null, rep_count: null, exercise_id: 'back_squat' }))
      .toBe('Back Squat');
  });
});
