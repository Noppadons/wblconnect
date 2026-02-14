import { getThaiNow, normalizeToDateOnly, getThaiToday, getThaiDayRange, parseOrThaiToday } from './date.util';

describe('Date Utility', () => {
  describe('getThaiNow', () => {
    it('should return a Date offset by +7 hours from UTC', () => {
      const before = new Date();
      const thaiNow = getThaiNow();
      const after = new Date();

      // Thai time should be ~7 hours ahead of UTC
      const diffHours = (thaiNow.getTime() - before.getTime()) / 3600000;
      expect(diffHours).toBeGreaterThanOrEqual(6.9);
      expect(diffHours).toBeLessThanOrEqual(7.1);
    });
  });

  describe('normalizeToDateOnly', () => {
    it('should strip time and return midnight UTC', () => {
      const date = new Date('2024-06-15T14:30:45.123Z');
      const normalized = normalizeToDateOnly(date);

      expect(normalized.getUTCHours()).toBe(0);
      expect(normalized.getUTCMinutes()).toBe(0);
      expect(normalized.getUTCSeconds()).toBe(0);
      expect(normalized.getUTCMilliseconds()).toBe(0);
      expect(normalized.getUTCFullYear()).toBe(2024);
      expect(normalized.getUTCMonth()).toBe(5); // June = 5
      expect(normalized.getUTCDate()).toBe(15);
    });

    it('should handle dates near midnight correctly', () => {
      const date = new Date('2024-06-15T23:59:59.999Z');
      const normalized = normalizeToDateOnly(date);
      expect(normalized.getUTCDate()).toBe(15);
    });
  });

  describe('getThaiToday', () => {
    it('should return a date with time set to midnight UTC', () => {
      const today = getThaiToday();
      expect(today.getUTCHours()).toBe(0);
      expect(today.getUTCMinutes()).toBe(0);
      expect(today.getUTCSeconds()).toBe(0);
    });
  });

  describe('getThaiDayRange', () => {
    it('should return start before end', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const { start, end } = getThaiDayRange(date);

      expect(start.getTime()).toBeLessThan(end.getTime());
    });

    it('should span approximately 24 hours', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const { start, end } = getThaiDayRange(date);

      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / 3600000;
      // Should be close to 24 hours (minus 1ms)
      expect(diffHours).toBeGreaterThan(23);
      expect(diffHours).toBeLessThanOrEqual(24);
    });
  });

  describe('parseOrThaiToday', () => {
    it('should parse a valid date string', () => {
      const result = parseOrThaiToday('2024-06-15');
      expect(result.getUTCFullYear()).toBe(2024);
      expect(result.getUTCMonth()).toBe(5);
      expect(result.getUTCDate()).toBe(15);
      expect(result.getUTCHours()).toBe(0);
    });

    it('should return Thai today for undefined input', () => {
      const result = parseOrThaiToday(undefined);
      const today = getThaiToday();
      expect(result.getTime()).toBe(today.getTime());
    });

    it('should return Thai today for invalid date string', () => {
      const result = parseOrThaiToday('not-a-date');
      const today = getThaiToday();
      expect(result.getTime()).toBe(today.getTime());
    });

    it('should return Thai today for empty string', () => {
      const result = parseOrThaiToday('');
      const today = getThaiToday();
      expect(result.getTime()).toBe(today.getTime());
    });
  });
});
