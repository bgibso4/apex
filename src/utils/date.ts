/**
 * Returns today's date as YYYY-MM-DD in the device's local timezone.
 * Avoids the UTC shift bug where `new Date().toISOString().split('T')[0]`
 * returns tomorrow's date when called late in the evening.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
