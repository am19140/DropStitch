const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "14 September 2026" */
export function longDate(time: number) {
  const d = new Date(time);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "14 Sep" */
export function shortDate(time: number) {
  const d = new Date(time);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** "today", "yesterday", "17 days ago" */
export function daysAgo(time: number, now = Date.now()) {
  const start = new Date(time);
  const end = new Date(now);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

/** "THURSDAY, 1 OCTOBER" */
export function todayEyebrow(now = Date.now()) {
  const d = new Date(now);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`.toUpperCase();
}
