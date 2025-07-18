import { formatTime } from '../utils/timeUtils';

describe('timeUtils', () => {
  describe('formatTime', () => {
    test('should format zero seconds correctly', () => {
      expect(formatTime(0)).toBe('0:00');
    });

    test('should format seconds under one minute correctly', () => {
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(45)).toBe('0:45');
      expect(formatTime(59)).toBe('0:59');
    });

    test('should format exactly one minute correctly', () => {
      expect(formatTime(60)).toBe('1:00');
    });

    test('should format minutes and seconds correctly', () => {
      expect(formatTime(90)).toBe('1:30');
      expect(formatTime(125)).toBe('2:05');
      expect(formatTime(180)).toBe('3:00');
      expect(formatTime(245)).toBe('4:05');
    });

    test('should handle large time values', () => {
      expect(formatTime(3600)).toBe('60:00');
      expect(formatTime(3661)).toBe('61:01');
      expect(formatTime(3725)).toBe('62:05');
    });

    test('should handle edge cases', () => {
      expect(formatTime(1)).toBe('0:01');
      expect(formatTime(61)).toBe('1:01');
      expect(formatTime(599)).toBe('9:59');
      expect(formatTime(600)).toBe('10:00');
    });
  });
});
