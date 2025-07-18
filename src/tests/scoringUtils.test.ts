import {
  calculateTimeBonuses,
  calculateCorrectnessMultiplier,
  calculateRunningScore,
  calculateScore,
  formatScore,
} from '../utils/scoringUtils';
import { Puzzle, FeedbackType, GameStats } from '../types/puzzle';

describe('scoringUtils', () => {
  const mockPuzzle: Puzzle = {
    solution: [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 1, 2, 3],
      [4, 5, 6, 7],
    ],
    startingBoard: [
      [1, null, null, null],
      [null, 6, null, null],
      [null, null, 2, null],
      [null, null, null, 7],
    ],
    rowConstraints: [],
    colConstraints: [],
    date: '2024-01-01',
  };

  describe('calculateTimeBonuses', () => {
    test('should return max bonus for time under 1 minute', () => {
      const result = calculateTimeBonuses(30);
      expect(result.bonus).toBe(500);
      expect(result.multiplier).toBe(1.0);
    });

    test('should return max bonus for exactly 1 minute', () => {
      const result = calculateTimeBonuses(60);
      expect(result.bonus).toBe(500);
      expect(result.multiplier).toBe(1.0);
    });

    test('should decrease bonus by 100 for each 30 seconds over 1 minute', () => {
      const result1 = calculateTimeBonuses(90);
      expect(result1.bonus).toBe(400);
      expect(result1.multiplier).toBe(1.0);

      const result2 = calculateTimeBonuses(120);
      expect(result2.bonus).toBe(300);
      expect(result2.multiplier).toBe(1.0);

      const result3 = calculateTimeBonuses(150);
      expect(result3.bonus).toBe(200);
      expect(result3.multiplier).toBe(1.0);
    });

    test('should return 0 bonus for very long times', () => {
      const result = calculateTimeBonuses(300);
      expect(result.bonus).toBe(0);
      expect(result.multiplier).toBe(1.0);
    });

    test('should handle edge case of 1 minute 15 seconds', () => {
      const result = calculateTimeBonuses(75);
      expect(result.bonus).toBe(400);
      expect(result.multiplier).toBe(1.0);
    });
  });

  describe('calculateCorrectnessMultiplier', () => {
    test('should return 1.0 for no first-time correct cells', () => {
      const result = calculateCorrectnessMultiplier(0);
      expect(result).toBe(1.0);
    });

    test('should increase multiplier by 0.1 for each first-time correct cell', () => {
      const result1 = calculateCorrectnessMultiplier(1);
      expect(result1).toBe(1.1);

      const result2 = calculateCorrectnessMultiplier(5);
      expect(result2).toBe(1.5);

      const result3 = calculateCorrectnessMultiplier(10);
      expect(result3).toBe(2.0);
    });
  });

  describe('calculateRunningScore', () => {
    test('should calculate score based on correct guesses and first-time bonuses', () => {
      const feedback: FeedbackType[][] = [
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
      ];

      const gameStats: GameStats = {
        totalGuesses: 20,
        correctGuesses: 16,
        wrongGuesses: 4,
        firstTimeCorrectRows: 2,
        firstTimeCorrectCols: 1,
        firstTimeCorrectCells: 8,
        timeInSeconds: 120,
      };

      const score = calculateRunningScore(mockPuzzle, feedback, gameStats);
      const expectedScore = 16 * 50 + (2 + 1) * 100; // 800 + 300 = 1100
      expect(score).toBe(expectedScore);
    });

    test('should handle zero correct guesses', () => {
      const feedback: FeedbackType[][] = [
        ['none', 'none', 'none', 'none'],
        ['none', 'none', 'none', 'none'],
        ['none', 'none', 'none', 'none'],
        ['none', 'none', 'none', 'none'],
      ];

      const gameStats: GameStats = {
        totalGuesses: 5,
        correctGuesses: 0,
        wrongGuesses: 5,
        firstTimeCorrectRows: 0,
        firstTimeCorrectCols: 0,
        firstTimeCorrectCells: 0,
        timeInSeconds: 60,
      };

      const score = calculateRunningScore(mockPuzzle, feedback, gameStats);
      expect(score).toBe(0);
    });

    test('should handle no first-time bonuses', () => {
      const feedback: FeedbackType[][] = [
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
      ];

      const gameStats: GameStats = {
        totalGuesses: 16,
        correctGuesses: 16,
        wrongGuesses: 0,
        firstTimeCorrectRows: 0,
        firstTimeCorrectCols: 0,
        firstTimeCorrectCells: 0,
        timeInSeconds: 60,
      };

      const score = calculateRunningScore(mockPuzzle, feedback, gameStats);
      expect(score).toBe(16 * 50); // 800
    });
  });

  describe('calculateScore', () => {
    test('should calculate complete score breakdown for completed puzzle', () => {
      const feedback: FeedbackType[][] = [
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
      ];

      const gameStats: GameStats = {
        totalGuesses: 7,
        correctGuesses: 16,
        wrongGuesses: 0,
        firstTimeCorrectRows: 2,
        firstTimeCorrectCols: 1,
        firstTimeCorrectCells: 8,
        timeInSeconds: 45,
      };

      const scoreBreakdown = calculateScore(mockPuzzle, feedback, gameStats);

      expect(scoreBreakdown.baseScore).toBe(0);
      expect(scoreBreakdown.timeBonus).toBe(500);
      expect(scoreBreakdown.timeMultiplier).toBe(1.0);
      expect(scoreBreakdown.firstTimeCorrectBonus).toBe(300);
      expect(scoreBreakdown.perfectAccuracyBonus).toBe(300);
      expect(scoreBreakdown.efficiencyBonus).toBe(200);
      expect(scoreBreakdown.difficultyMultiplier).toBe(1.8);

      const expectedSubtotal = 500 + 300 + 300 + 200; // 1300
      const expectedTotal = Math.round(expectedSubtotal * 1.0 * 1.8); // 2340
      expect(scoreBreakdown.totalScore).toBe(expectedTotal);
    });

    test('should not give perfect accuracy bonus for puzzle with wrong guesses', () => {
      const feedback: FeedbackType[][] = [
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
      ];

      const gameStats: GameStats = {
        totalGuesses: 20,
        correctGuesses: 16,
        wrongGuesses: 4,
        firstTimeCorrectRows: 1,
        firstTimeCorrectCols: 1,
        firstTimeCorrectCells: 5,
        timeInSeconds: 60,
      };

      const scoreBreakdown = calculateScore(mockPuzzle, feedback, gameStats);

      expect(scoreBreakdown.perfectAccuracyBonus).toBe(0);
      expect(scoreBreakdown.efficiencyBonus).toBe(0); // More than 8 guesses
    });

    test('should not give efficiency bonus for too many guesses', () => {
      const feedback: FeedbackType[][] = [
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
      ];

      const gameStats: GameStats = {
        totalGuesses: 10,
        correctGuesses: 16,
        wrongGuesses: 0,
        firstTimeCorrectRows: 1,
        firstTimeCorrectCols: 1,
        firstTimeCorrectCells: 5,
        timeInSeconds: 60,
      };

      const scoreBreakdown = calculateScore(mockPuzzle, feedback, gameStats);

      expect(scoreBreakdown.efficiencyBonus).toBe(0);
    });

    test('should handle incomplete puzzle', () => {
      const feedback: FeedbackType[][] = [
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'none'],
      ];

      const gameStats: GameStats = {
        totalGuesses: 15,
        correctGuesses: 15,
        wrongGuesses: 0,
        firstTimeCorrectRows: 1,
        firstTimeCorrectCols: 1,
        firstTimeCorrectCells: 5,
        timeInSeconds: 120,
      };

      const scoreBreakdown = calculateScore(mockPuzzle, feedback, gameStats);

      expect(scoreBreakdown.perfectAccuracyBonus).toBe(0);
      expect(scoreBreakdown.efficiencyBonus).toBe(0);
    });

    test('should handle long completion time', () => {
      const feedback: FeedbackType[][] = [
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
      ];

      const gameStats: GameStats = {
        totalGuesses: 8,
        correctGuesses: 16,
        wrongGuesses: 0,
        firstTimeCorrectRows: 1,
        firstTimeCorrectCols: 1,
        firstTimeCorrectCells: 5,
        timeInSeconds: 300,
      };

      const scoreBreakdown = calculateScore(mockPuzzle, feedback, gameStats);

      expect(scoreBreakdown.timeBonus).toBe(0);
    });
  });

  describe('formatScore', () => {
    test('should format small numbers without commas', () => {
      expect(formatScore(123)).toBe('123');
      expect(formatScore(999)).toBe('999');
    });

    test('should format large numbers with commas', () => {
      expect(formatScore(1000)).toBe('1,000');
      expect(formatScore(12345)).toBe('12,345');
      expect(formatScore(123456)).toBe('123,456');
      expect(formatScore(1234567)).toBe('1,234,567');
    });

    test('should handle zero', () => {
      expect(formatScore(0)).toBe('0');
    });

    test('should handle negative numbers', () => {
      expect(formatScore(-123)).toBe('-123');
      expect(formatScore(-1234)).toBe('-1,234');
    });
  });
});
