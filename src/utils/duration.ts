const MAX_DIGITS = 6;

export function sanitizeDigits(input: string): string {
  return input.replace(/\D/g, '').replace(/^0+/, '').slice(-MAX_DIGITS);
}

export function formatDuration(digits: string): string {
  const clean = sanitizeDigits(digits);
  if (!clean) return '';
  const padded = clean.padStart(6, '0');
  const h = parseInt(padded.slice(0, 2), 10);
  const m = parseInt(padded.slice(2, 4), 10);
  const s = parseInt(padded.slice(4, 6), 10);
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`;
  return `${m}:${ss}`;
}

export function digitsToMinutes(digits: string): number {
  const clean = sanitizeDigits(digits);
  if (!clean) return 0;
  const padded = clean.padStart(6, '0');
  const h = parseInt(padded.slice(0, 2), 10);
  const m = parseInt(padded.slice(2, 4), 10);
  const s = parseInt(padded.slice(4, 6), 10);
  return h * 60 + m + s / 60;
}

export function minutesToDigits(min: number): string {
  if (!min || min <= 0 || !Number.isFinite(min)) return '';
  const totalSec = Math.round(min * 60);
  if (totalSec <= 0) return '';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const hhmmss = `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}${String(s).padStart(2, '0')}`;
  return hhmmss.replace(/^0+/, '');
}
