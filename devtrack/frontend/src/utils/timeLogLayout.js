// Domain-pure helpers for the time-log calendar. Imports only date.js — no
// React — so the trickiest logic here is verifiable directly under Node.

import { isFutureDate, isWeekend, timeStrToMinutes } from './date.js';

/**
 * Sum logged hours per date.
 *
 * Number() is not optional: Pydantic serialises Decimal as a STRING, so the API
 * sends hours as "2.50". Without coercion "2.50" + "1.25" concatenates to
 * "2.501.25" and every day total is silently wrong.
 */
export function sumHoursByDate(entries) {
  const totals = new Map();
  for (const e of entries) {
    totals.set(e.logged_date, (totals.get(e.logged_date) ?? 0) + Number(e.hours));
  }
  return totals;
}

export function groupByDate(entries) {
  const byDate = new Map();
  for (const e of entries) {
    const list = byDate.get(e.logged_date);
    if (list) list.push(e);
    else byDate.set(e.logged_date, [e]);
  }
  return byDate;
}

/**
 * Which colour a day cell gets.
 *
 * Evaluation order is deliberate: the positive cases are checked FIRST so a
 * Saturday with 6 hours logged still reads as blue. The weekend/future rules
 * suppress *red*, they must not suppress *credit* — inverting this greys out
 * exactly the work a solo developer most wants to see.
 */
export function dayStatus(totalHours, dateStr, target, trackingStart) {
  if (totalHours >= target) return 'green';
  if (totalHours > 0) return 'blue';
  if (isWeekend(dateStr)) return 'neutral';
  if (isFutureDate(dateStr)) return 'neutral';
  // Bounds how far back red goes — without this, every weekday since 1970
  // renders as a missed day, including dates before the tool existed.
  if (trackingStart && dateStr < trackingStart) return 'neutral';
  return 'red';
}

export const DAY_STATUS_CLASSES = {
  green: 'bg-ok-bg text-ok-fg border border-ok-fg/20',
  blue: 'bg-info-bg text-info-fg border border-info-fg/20',
  red: 'bg-bad-bg text-bad-fg border border-bad-fg/20',
  // Quieter than the three signal colours — "unmarked", not a status. On dark
  // this has to sit *above* the page background to still read as a cell, so
  // it uses the card surface rather than a lighter tint.
  neutral: 'bg-card text-fg-faint border border-line',
};

/**
 * Positions entries on an hour grid, splitting overlapping ones into columns.
 *
 * Because `hours` is decoupled from the start→end span, long spans are the
 * expected case (an all-day "worked on the API" entry alongside a 1h meeting),
 * so overlap is normal rather than an edge case. Without this, blocks render
 * exactly on top of each other.
 *
 * Clustering (step 2) is what keeps one long entry from narrowing the whole
 * day: only genuinely conflicting entries share width.
 *
 * Returns [{ entry, top, height, leftPct, widthPct }] in px / %.
 */
export function layoutEntries(entries, gridStartMin, hourPx, minHeight = 20) {
  const items = entries
    .map((entry) => ({
      entry,
      start: timeStrToMinutes(entry.start_time),
      end: timeStrToMinutes(entry.end_time),
    }))
    // Longest-first within the same start reads better when stacked.
    .sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));

  // 1. Group into clusters of transitively-overlapping items.
  const clusters = [];
  let current = [];
  let clusterEnd = -Infinity;
  for (const item of items) {
    if (item.start >= clusterEnd && current.length) {
      clusters.push(current);
      current = [];
    }
    current.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  if (current.length) clusters.push(current);

  // 2. Greedy column assignment within each cluster.
  const out = [];
  for (const cluster of clusters) {
    const columnEnds = []; // last end time placed in each column
    for (const item of cluster) {
      let col = columnEnds.findIndex((end) => end <= item.start);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(item.end);
      } else {
        columnEnds[col] = item.end;
      }
      item.col = col;
    }
    const cols = columnEnds.length;
    for (const item of cluster) {
      out.push({
        entry: item.entry,
        top: ((item.start - gridStartMin) / 60) * hourPx,
        // Floor guarantees short entries stay clickable.
        height: Math.max(((item.end - item.start) / 60) * hourPx, minHeight),
        leftPct: (item.col / cols) * 100,
        widthPct: 100 / cols,
      });
    }
  }
  return out;
}

/**
 * Grid window derived from the data rather than configured, so nothing is ever
 * clipped: an entry at 03:00 expands the window instead of vanishing.
 */
export function gridWindow(entries, defaultStartHour = 6, defaultEndHour = 22) {
  let startHour = defaultStartHour;
  let endHour = defaultEndHour;
  for (const e of entries) {
    startHour = Math.min(startHour, Math.floor(timeStrToMinutes(e.start_time) / 60));
    endHour = Math.max(endHour, Math.ceil(timeStrToMinutes(e.end_time) / 60));
  }
  return { startHour, endHour: Math.min(endHour, 24) };
}
