// Pure date/time primitives. Imports nothing — not even React — so this
// module can be exercised directly under Node without a test runner.
//
// Everything here works in LOCAL time. The recurring hazard is that several
// native Date APIs silently switch to UTC; each workaround is noted inline.

export const WEEK_STARTS_ON = 1; // Monday

/**
 * Local YYYY-MM-DD. Never use toISOString().slice(0,10) for this: at a positive
 * UTC offset local midnight is the previous day in UTC, so every date shifts by
 * one. This is the highest-risk function in the calendar.
 */
export function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Bare new Date('2026-08-01') parses as UTC; the time suffix forces local. */
export function parseDateStr(s) {
  return new Date(`${s}T00:00:00`);
}

export function todayStr() {
  return toDateStr(new Date());
}

/**
 * Constructor-based so month/day overflow normalises (Aug 32 -> Sep 1).
 * Not getTime() + n*86400000: DST days are 23 or 25 hours, so millisecond
 * arithmetic lands on the wrong date twice a year.
 */
export function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/**
 * Always anchored to day 1. Naive setMonth on Jan 31 gives Mar 3, which would
 * make month paging skip February entirely.
 */
export function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Day 0 of the next month is the last day of this one. */
export function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** getDay() is Sunday=0, hence the modulo rather than a plain subtraction. */
export function startOfWeek(d, weekStartsOn = WEEK_STARTS_ON) {
  return addDays(d, -((d.getDay() - weekStartsOn + 7) % 7));
}

/**
 * Exactly 42 cells (6 rows), including leading/trailing days from adjacent
 * months. Fixed at 6 rows so the grid height doesn't jump between a 5-row and
 * 6-row month.
 */
export function buildMonthGrid(anchor, weekStartsOn = WEEK_STARTS_ON) {
  const first = startOfMonth(anchor);
  const gridStart = startOfWeek(first, weekStartsOn);
  const month = anchor.getMonth();
  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(gridStart, i);
    return { date, dateStr: toDateStr(date), inMonth: date.getMonth() === month };
  });
}

export function buildWeekDays(anchor, weekStartsOn = WEEK_STARTS_ON) {
  const start = startOfWeek(anchor, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return { date, dateStr: toDateStr(date), inMonth: true };
  });
}

export function isWeekend(dateStr) {
  const day = parseDateStr(dateStr).getDay();
  return day === 0 || day === 6;
}

/**
 * Plain string comparison — ISO dates sort lexicographically, so this needs no
 * Date objects and carries no timezone risk at all. Prefer it wherever possible.
 */
export function isFutureDate(dateStr) {
  return dateStr > todayStr();
}

export function isToday(dateStr) {
  return dateStr === todayStr();
}

export function formatMonthTitle(d) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function formatDayTitle(dateStr) {
  return parseDateStr(dateStr).toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

/** Collapses shared month/year, and still reads correctly across a year boundary. */
export function formatWeekTitle(startStr, endStr) {
  const a = parseDateStr(startStr);
  const b = parseDateStr(endStr);
  const sameYear = a.getFullYear() === b.getFullYear();
  const sameMonth = sameYear && a.getMonth() === b.getMonth();
  const left = a.toLocaleDateString(undefined, {
    day: 'numeric',
    month: sameMonth ? undefined : 'short',
    year: sameYear ? undefined : 'numeric',
  });
  const right = b.toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  return `${left} – ${right}`;
}

/** Accepts '09:30' or '09:30:00' — the API returns seconds, inputs don't. */
export function timeStrToMinutes(t) {
  const [h, m] = t.split(':');
  return Number(h) * 60 + Number(m);
}

export function minutesToTimeStr(mins) {
  const clamped = Math.max(0, Math.min(mins, 23 * 60 + 59));
  const h = String(Math.floor(clamped / 60)).padStart(2, '0');
  const m = String(clamped % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * <input type="time"> renders BLANK for a seconds-bearing value at the default
 * step, so prefilling an edit form with the API's '09:00:00' would show empty
 * fields and silently wipe the times on save.
 */
export function toTimeInputValue(apiTime) {
  return apiTime ? apiTime.slice(0, 5) : '';
}

export function addMinutesToTimeStr(t, mins) {
  return minutesToTimeStr(timeStrToMinutes(t) + mins);
}
