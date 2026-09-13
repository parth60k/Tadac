/**
 * Date utility layer — timezone-safe, deterministic date operations.
 *
 * Core rule from PRD §5.6:
 *   All revision due dates are calendar dates in the user's configured timezone.
 *   NEVER shift dates because of UTC conversion.
 *   Store date-only values as YYYY-MM-DD strings — never as midnight UTC DateTime.
 */

import { REVISION_INTERVALS, type RevisionInterval } from '@/types/domain';

// ─── Date string helpers ──────────────────────────────────────────────────────

/**
 * Returns today as YYYY-MM-DD in the given IANA timezone.
 * Defaults to Asia/Kolkata.
 */
export function todayDate(timezone = 'Asia/Kolkata'): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  // en-CA locale produces YYYY-MM-DD natively
}

/**
 * Parses a YYYY-MM-DD string into { year, month, day } parts.
 * Safe — does NOT use the Date constructor to avoid UTC shifts.
 */
export function parseDateString(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

/**
 * Adds `days` calendar days to a YYYY-MM-DD string and returns a new YYYY-MM-DD string.
 * Uses UTC Date math to stay day-boundary safe.
 */
export function addDays(dateStr: string, days: number): string {
  const { year, month, day } = parseDateString(dateStr);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return d.toISOString().slice(0, 10);
}

/**
 * Returns the difference in calendar days between two YYYY-MM-DD strings.
 * Positive if dateB is after dateA.
 */
export function diffDays(dateA: string, dateB: string): number {
  const msPerDay = 86_400_000;
  const { year: ay, month: am, day: ad } = parseDateString(dateA);
  const { year: by, month: bm, day: bd } = parseDateString(dateB);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / msPerDay);
}

/**
 * Formats a YYYY-MM-DD string for display.
 * e.g. "2026-09-14" → "Sep 14"
 */
export function formatDateShort(dateStr: string): string {
  const { year, month, day } = parseDateString(dateStr);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a YYYY-MM-DD string for display.
 * e.g. "2026-09-14" → "September 14, 2026"
 */
export function formatDateLong(dateStr: string): string {
  const { year, month, day } = parseDateString(dateStr);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Revision scheduling ──────────────────────────────────────────────────────

/**
 * Given the Day 0 anchor (learnedAt as YYYY-MM-DD), compute the five
 * checkpoint due dates anchored to that date.
 *
 * PRD 5.6 critical rule:
 *   Due dates are ALWAYS anchored to the ORIGINAL learnedAt.
 *   Completing a checkpoint NEVER shifts the remaining ones.
 *
 * Example:
 *   learnedAt = "2026-09-13"
 *   → checkpoint 1: "2026-09-14" (Day 1)
 *   → checkpoint 2: "2026-09-16" (Day 3)
 *   → checkpoint 3: "2026-09-20" (Day 7)
 *   → checkpoint 4: "2026-09-28" (Day 15)
 *   → checkpoint 5: "2026-10-13" (Day 30)
 */
export function computeRevisionSchedule(
  learnedAt: string
): Array<{ sequence: number; intervalDays: RevisionInterval; dueDate: string }> {
  return REVISION_INTERVALS.map((interval, index) => ({
    sequence:     index + 1,
    intervalDays: interval,
    dueDate:      addDays(learnedAt, interval),
  }));
}

// ─── Checkpoint view classification ───────────────────────────────────────────

import type { CheckpointView } from '@/types/domain';

/**
 * Classifies a checkpoint's presentation state based on its dueDate vs today.
 * COMPLETED always wins over date comparison.
 */
export function classifyCheckpoint(
  dueDate: string,
  status: 'PENDING' | 'COMPLETED',
  today: string
): CheckpointView {
  if (status === 'COMPLETED') return 'COMPLETED';
  const diff = diffDays(today, dueDate); // positive = dueDate is in the future
  if (diff === 0) return 'DUE_TODAY';
  if (diff < 0)  return 'OVERDUE';
  return 'UPCOMING';
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

/**
 * Formats focus duration in minutes to a human-readable string.
 * e.g. 162 → "2h 42m"
 */
export function formatDuration(totalMins: number): string {
  if (totalMins < 60) return `${totalMins}m`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Returns a greeting based on hour of day.
 */
export function getGreeting(timezone = 'Asia/Kolkata'): string {
  const hour = new Date().toLocaleString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  });
  const h = parseInt(hour, 10);
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Returns a long date string for the dashboard.
 * e.g. "Saturday, September 13, 2026"
 */
export function formatDateFull(timezone = 'Asia/Kolkata'): string {
  return new Date().toLocaleDateString('en-IN', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
