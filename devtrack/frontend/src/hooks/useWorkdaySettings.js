import { useSyncExternalStore } from 'react';
import { todayStr } from '../utils/date.js';

const TARGET_KEY = 'devtrack.workdayTargetHours';
const TRACKING_KEY = 'devtrack.trackingStartDate';
const EVENT = 'devtrack:settings';

export const DEFAULT_TARGET = 8;

/** Reads are defensive: localStorage can hold anything a user or old build put there. */
export function getWorkdayTarget() {
  const raw = localStorage.getItem(TARGET_KEY);
  const n = Number(raw);
  if (!raw || !Number.isFinite(n) || n <= 0 || n > 24) return DEFAULT_TARGET;
  return n;
}

/**
 * Bounds how far back red goes. Defaults to today on first run so a brand-new
 * install doesn't show a wall of red for every weekday since 1970.
 */
export function getTrackingStartDate() {
  const raw = localStorage.getItem(TRACKING_KEY);
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const today = todayStr();
    localStorage.setItem(TRACKING_KEY, today);
    return today;
  }
  return raw;
}

function emit() {
  // localStorage's own 'storage' event only fires in OTHER tabs, so same-tab
  // listeners need an explicit nudge.
  window.dispatchEvent(new Event(EVENT));
}

export function setWorkdayTarget(value) {
  localStorage.setItem(TARGET_KEY, String(value));
  emit();
}

export function setTrackingStartDate(value) {
  localStorage.setItem(TRACKING_KEY, value);
  emit();
}

function subscribe(callback) {
  window.addEventListener(EVENT, callback); // same tab
  window.addEventListener('storage', callback); // other tabs
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

// Both snapshots return PRIMITIVES. useSyncExternalStore compares by identity
// on every render, so returning a fresh object here would loop forever.
export function useWorkdayTarget() {
  return useSyncExternalStore(subscribe, getWorkdayTarget);
}

export function useTrackingStartDate() {
  return useSyncExternalStore(subscribe, getTrackingStartDate);
}
