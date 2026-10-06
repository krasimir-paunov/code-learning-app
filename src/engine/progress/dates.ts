/** Local calendar date (not UTC): a streak day is the learner's day. */
export function toLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Calendar arithmetic on YYYY-MM-DD strings, immune to DST because it works in UTC. */
export function addDays(localDate: string, days: number): string {
  const [y = 0, m = 1, d = 1] = localDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}
