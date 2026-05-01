import { formatDuration, digitsToMinutes, minutesToDigits, sanitizeDigits } from '../../src/utils/duration';

describe('sanitizeDigits', () => {
  it('keeps only digits', () => {
    expect(sanitizeDigits('1:23:45')).toBe('12345');
    expect(sanitizeDigits('abc5def')).toBe('5');
  });

  it('strips leading zeros', () => {
    expect(sanitizeDigits('00525')).toBe('525');
    expect(sanitizeDigits('000')).toBe('');
  });

  it('caps at 6 digits, taking the last six', () => {
    expect(sanitizeDigits('1234567')).toBe('234567');
  });

  it('returns empty for empty input', () => {
    expect(sanitizeDigits('')).toBe('');
  });
});

describe('formatDuration', () => {
  it('returns empty string for empty input', () => {
    expect(formatDuration('')).toBe('');
  });

  it('formats single digit as M:SS', () => {
    expect(formatDuration('2')).toBe('0:02');
    expect(formatDuration('5')).toBe('0:05');
  });

  it('formats two digits as M:SS', () => {
    expect(formatDuration('25')).toBe('0:25');
    expect(formatDuration('59')).toBe('0:59');
  });

  it('formats three digits as M:SS', () => {
    expect(formatDuration('250')).toBe('2:50');
    expect(formatDuration('525')).toBe('5:25');
  });

  it('formats four digits as MM:SS', () => {
    expect(formatDuration('2500')).toBe('25:00');
    expect(formatDuration('1525')).toBe('15:25');
  });

  it('formats five digits as H:MM:SS', () => {
    expect(formatDuration('12500')).toBe('1:25:00');
    expect(formatDuration('21525')).toBe('2:15:25');
  });

  it('formats six digits as HH:MM:SS', () => {
    expect(formatDuration('121525')).toBe('12:15:25');
    expect(formatDuration('995959')).toBe('99:59:59');
  });

  it('strips leading zeros before formatting', () => {
    expect(formatDuration('00525')).toBe('5:25');
  });
});

describe('digitsToMinutes', () => {
  it('returns 0 for empty', () => {
    expect(digitsToMinutes('')).toBe(0);
  });

  it('converts seconds', () => {
    expect(digitsToMinutes('30')).toBeCloseTo(0.5, 5);
  });

  it('converts minutes exactly', () => {
    expect(digitsToMinutes('2500')).toBe(25);
  });

  it('converts minutes and seconds', () => {
    expect(digitsToMinutes('2530')).toBeCloseTo(25.5, 5);
  });

  it('converts hours, minutes, seconds', () => {
    // 2:30:00 → 150 min
    expect(digitsToMinutes('23000')).toBe(150);
    // 1:25:00 → 85 min
    expect(digitsToMinutes('12500')).toBe(85);
  });
});

describe('minutesToDigits', () => {
  it('returns empty string for 0 or negative', () => {
    expect(minutesToDigits(0)).toBe('');
    expect(minutesToDigits(-5)).toBe('');
  });

  it('converts whole minutes', () => {
    expect(minutesToDigits(25)).toBe('2500');
    expect(minutesToDigits(5)).toBe('500');
  });

  it('converts minutes with decimal seconds', () => {
    expect(minutesToDigits(25.5)).toBe('2530');
  });

  it('converts hours-scale durations', () => {
    expect(minutesToDigits(150)).toBe('23000'); // 2:30:00
    expect(minutesToDigits(85)).toBe('12500');  // 1:25:00
  });

  it('converts sub-minute durations', () => {
    // 30 sec
    expect(minutesToDigits(0.5)).toBe('30');
  });

  it('roundtrips with formatDuration', () => {
    expect(formatDuration(minutesToDigits(25.5))).toBe('25:30');
    expect(formatDuration(minutesToDigits(150))).toBe('2:30:00');
    expect(formatDuration(minutesToDigits(0.5))).toBe('0:30');
  });
});
