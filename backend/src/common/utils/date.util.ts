import { ATTENDANCE } from '../constants';

/**
 * Get current date/time adjusted to Thai timezone (UTC+7).
 * Works correctly regardless of server timezone.
 */
export function getThaiNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + ATTENDANCE.THAI_UTC_OFFSET_HOURS * 3600000);
}

/**
 * Normalize a date to midnight UTC (YYYY-MM-DD 00:00:00.000Z).
 * Used for attendance unique constraints where only the date portion matters.
 */
export function normalizeToDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Get today's date in Thai timezone, normalized to midnight UTC.
 * This is the standard way to get "today" for attendance records.
 */
export function getThaiToday(): Date {
  const thaiNow = getThaiNow();
  return normalizeToDateOnly(thaiNow);
}

/**
 * Get start and end of a given day in Thai timezone, converted to UTC.
 * Useful for querying records within a specific Thai calendar day.
 */
export function getThaiDayRange(date: Date): { start: Date; end: Date } {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  // Thai midnight = UTC 17:00 previous day
  const start = new Date(Date.UTC(year, month, day, -ATTENDANCE.THAI_UTC_OFFSET_HOURS, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, day, 24 - ATTENDANCE.THAI_UTC_OFFSET_HOURS - 1, 59, 59, 999));

  return { start, end };
}

/**
 * Parse a date string or use Thai today if not provided.
 * Returns a normalized date suitable for attendance queries.
 */
export function parseOrThaiToday(dateString?: string): Date {
  if (dateString) {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      return normalizeToDateOnly(parsed);
    }
  }
  return getThaiToday();
}
