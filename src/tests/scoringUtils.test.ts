import {
  calculateTimeBonuses,
  calculateCorrectnessMultiplier,
  calculateDifficultyMultiplier,
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

  describe('calculateDifficultyMultiplier', () => {
    const puzzleWith4Prefilled: Puzzle = {
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

    const puzzleWith2Prefilled: Puzzle = {
      solution: [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 1, 2, 3],
        [4, 5, 6, 7],
      ],
      startingBoard: [
        [1, null, null, null],
        [null, null, null, null],
        [null, null, 2, null],
        [null, null, null, null],
      ],
      rowConstraints: [],
      colConstraints: [],
      date: '2024-01-01',
    };

    const puzzleWith0Prefilled: Puzzle = {
      solution: [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 1, 2, 3],
        [4, 5, 6, 7],
      ],
      startingBoard: [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ],
      rowConstraints: [],
      colConstraints: [],
      date: '2024-01-01',
    };

    test('should calculate difficulty multiplier based on pre-filled cells and correctness', () => {
      // 4 pre-filled cells (minimum difficulty) + 8 first-time correct cells
      const result1 = calculateDifficultyMultiplier(puzzleWith4Prefilled, 8);
      expect(result1).toBe(1.8); // 1.8 * 1.0 = 1.8

      // 2 pre-filled cells (medium difficulty) + 8 first-time correct cells
      const result2 = calculateDifficultyMultiplier(puzzleWith2Prefilled, 8);
      expect(result2).toBe(2.7); // 1.8 * 1.5 = 2.7

      // 0 pre-filled cells (maximum difficulty) + 8 first-time correct cells
      const result3 = calculateDifficultyMultiplier(puzzleWith0Prefilled, 8);
      expect(result3).toBe(3.6); // 1.8 * 2.0 = 3.6
    });

    test('should handle edge cases with no first-time correct cells', () => {
      // 4 pre-filled cells + 0 first-time correct cells
      const result1 = calculateDifficultyMultiplier(puzzleWith4Prefilled, 0);
      expect(result1).toBe(1.0); // 1.0 * 1.0 = 1.0

      // 0 pre-filled cells + 0 first-time correct cells
      const result2 = calculateDifficultyMultiplier(puzzleWith0Prefilled, 0);
      expect(result2).toBe(2.0); // 1.0 * 2.0 = 2.0
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

      const guessedRows = new Set([0, 1, 2, 3]);
      const guessedCols = new Set([0, 1, 2, 3]);

      const score = calculateRunningScore(
        mockPuzzle,
        feedback,
        gameStats,
        guessedRows,
        guessedCols
      );
      const expectedScore = 12 * 100 + (2 + 1) * 100; // 1200 + 300 = 1500 (12 scoreable tiles, 4 pre-filled)
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

      const guessedRows = new Set<number>();
      const guessedCols = new Set<number>();

      const score = calculateRunningScore(
        mockPuzzle,
        feedback,
        gameStats,
        guessedRows,
        guessedCols
      );
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

      const guessedRows = new Set([0, 1, 2, 3]);
      const guessedCols = new Set([0, 1, 2, 3]);

      const score = calculateRunningScore(
        mockPuzzle,
        feedback,
        gameStats,
        guessedRows,
        guessedCols
      );
      expect(score).toBe(12 * 100); // 1200 (12 scoreable tiles, 4 pre-filled)
    });
  });

  describe('calculateBaseScore', () => {
    test('should score different tile types correctly', () => {
      const feedback: FeedbackType[][] = [
        ['correct', 'misplaced', 'wrong', 'none'],
        ['correct', 'misplaced', 'wrong', 'none'],
        ['correct', 'misplaced', 'wrong', 'none'],
        ['correct', 'misplaced', 'wrong', 'none'],
      ];

      const gameStats: GameStats = {
        totalGuesses: 4,
        correctGuesses: 4,
        wrongGuesses: 4,
        firstTimeCorrectRows: 0,
        firstTimeCorrectCols: 0,
        firstTimeCorrectCells: 0,
        timeInSeconds: 60,
      };

      const guessedRows = new Set([0, 1, 2, 3]);
      const guessedCols = new Set([0, 1, 2, 3]);

      const score = calculateRunningScore(
        mockPuzzle,
        feedback,
        gameStats,
        guessedRows,
        guessedCols
      );

      // Pre-filled tiles: [0,0], [1,1], [2,2], [3,3] - these are not scored
      // Scoreable tiles: 12 total
      // From the feedback pattern, we have:
      // - 3 correct tiles (excluding [0,0] which is pre-filled)
      // - 3 misplaced tiles (excluding [1,1] which is pre-filled)
      // - 3 wrong tiles (excluding [2,2] which is pre-filled)
      // - 3 none tiles (excluding [3,3] which is pre-filled)
      // 3 correct * 100 + 3 misplaced * 50 + 3 wrong * 0 + 3 none * 0 = 300 + 150 = 450
      expect(score).toBe(450);
    });

    test('should not score pre-filled tiles', () => {
      const feedback: FeedbackType[][] = [
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
      ];

      const gameStats: GameStats = {
        totalGuesses: 4,
        correctGuesses: 12, // Only 12 scoreable tiles (4 are pre-filled)
        wrongGuesses: 0,
        firstTimeCorrectRows: 0,
        firstTimeCorrectCols: 0,
        firstTimeCorrectCells: 0,
        timeInSeconds: 60,
      };

      const guessedRows = new Set([0, 1, 2, 3]);
      const guessedCols = new Set([0, 1, 2, 3]);

      const score = calculateRunningScore(
        mockPuzzle,
        feedback,
        gameStats,
        guessedRows,
        guessedCols
      );

      // Only 12 tiles are scoreable (4 are pre-filled)
      // 12 correct tiles * 100 = 1200
      expect(score).toBe(1200);
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

      const guessedRows = new Set([0, 1, 2, 3]);
      const guessedCols = new Set([0, 1, 2, 3]);

      const scoreBreakdown = calculateScore(
        mockPuzzle,
        feedback,
        gameStats,
        guessedRows,
        guessedCols
      );

      expect(scoreBreakdown.baseScore).toBe(1200); // 12 correct tiles * 100 (4 pre-filled)
      expect(scoreBreakdown.timeBonus).toBe(500);
      expect(scoreBreakdown.timeMultiplier).toBe(1.0);
      expect(scoreBreakdown.firstTimeCorrectBonus).toBe(300);
      expect(scoreBreakdown.perfectAccuracyBonus).toBe(300);
      expect(scoreBreakdown.efficiencyBonus).toBe(200);
      expect(scoreBreakdown.difficultyMultiplier).toBe(1.8);

      const expectedSubtotal = 1200 + 500 + 300 + 300 + 200; // 2500 (12 scoreable tiles)
      const expectedTotal = Math.round(expectedSubtotal * 1.0 * 1.8); // 4500
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

      const guessedRows = new Set([0, 1, 2, 3]);
      const guessedCols = new Set([0, 1, 2, 3]);

      const scoreBreakdown = calculateScore(
        mockPuzzle,
        feedback,
        gameStats,
        guessedRows,
        guessedCols
      );

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

      const guessedRows = new Set([0, 1, 2, 3]);
      const guessedCols = new Set([0, 1, 2, 3]);

      const scoreBreakdown = calculateScore(
        mockPuzzle,
        feedback,
        gameStats,
        guessedRows,
        guessedCols
      );

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

      const guessedRows = new Set([0, 1, 2]);
      const guessedCols = new Set([0, 1, 2, 3]);

      const scoreBreakdown = calculateScore(
        mockPuzzle,
        feedback,
        gameStats,
        guessedRows,
        guessedCols
      );

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

      const guessedRows = new Set([0, 1, 2, 3]);
      const guessedCols = new Set([0, 1, 2, 3]);

      const scoreBreakdown = calculateScore(
        mockPuzzle,
        feedback,
        gameStats,
        guessedRows,
        guessedCols
      );

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
