const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Local calendar day as "2026-10-08", for keying things by day. */
export function dayKey(time: number) {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The same time of day, `days` later (or earlier, when negative). DST-safe. */
export function addDays(time: number, days: number) {
  const d = new Date(time);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

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

/** "just now", "12 min ago", "10h ago", "yesterday", "3 days ago" */
export function timeAgo(time: number, now = Date.now()) {
  const minutes = Math.floor((now - time) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return daysAgo(time, now);
}

/** "2h 15m", "12 min", "under a minute" */
export function knitDuration(ms: number) {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'under a minute';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** "Good morning" / "Good afternoon" / "Good evening" */
export function greeting(now = Date.now()) {
  const hour = new Date(now).getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** "THURSDAY, 1 OCTOBER" */
export function todayEyebrow(now = Date.now()) {
  const d = new Date(now);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`.toUpperCase();
}
