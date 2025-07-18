import {
  isConstraintSatisfied,
  isPuzzleComplete,
  getDuplicates,
  emptyBoard,
  startingBoardToBoard,
} from '../utils/puzzleUtils';
import { calculateScore, calculateRunningScore } from '../utils/scoringUtils';
import { formatTime } from '../utils/timeUtils';
import { Puzzle, FeedbackType, GameStats } from '../types/puzzle';

describe('Core Functionality Tests', () => {
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
    rowConstraints: [
      { sum: 10 },
      { even: true },
      { contains: [1, 2] },
      { range: { min: 4, max: 7 } },
    ],
    colConstraints: [
      { sum: 19 },
      { even: false },
      { contains: [3, 6] },
      { range: { min: 3, max: 8 } },
    ],
    date: '2024-01-01',
  };

  describe('Constraint Validation', () => {
    test('should validate sum constraints correctly', () => {
      const board = [
        ['1', '2', '3', '4'],
        ['5', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];

      // Test row sum constraint
      expect(
        isConstraintSatisfied(mockPuzzle, board, { sum: 10 }, 'row', 0)
      ).toBe(true);
      expect(
        isConstraintSatisfied(mockPuzzle, board, { sum: 20 }, 'row', 0)
      ).toBe(false);

      // Test column sum constraint
      expect(
        isConstraintSatisfied(mockPuzzle, board, { sum: 19 }, 'col', 0)
      ).toBe(true);
      expect(
        isConstraintSatisfied(mockPuzzle, board, { sum: 25 }, 'col', 0)
      ).toBe(false);
    });

    test('should validate even/odd constraints correctly', () => {
      const evenBoard = [
        ['2', '4', '6', '8'],
        ['2', '4', '6', '8'],
        ['2', '4', '6', '8'],
        ['2', '4', '6', '8'],
      ];

      const oddBoard = [
        ['1', '3', '5', '7'],
        ['1', '3', '5', '7'],
        ['1', '3', '5', '7'],
        ['1', '3', '5', '7'],
      ];

      expect(
        isConstraintSatisfied(mockPuzzle, evenBoard, { even: true }, 'row', 0)
      ).toBe(true);
      expect(
        isConstraintSatisfied(mockPuzzle, evenBoard, { even: false }, 'row', 0)
      ).toBe(false);
      expect(
        isConstraintSatisfied(mockPuzzle, oddBoard, { even: true }, 'row', 0)
      ).toBe(false);
      expect(
        isConstraintSatisfied(mockPuzzle, oddBoard, { even: false }, 'row', 0)
      ).toBe(true);
    });

    test('should validate contains constraints correctly', () => {
      const board = [
        ['1', '2', '3', '4'],
        ['5', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];

      expect(
        isConstraintSatisfied(mockPuzzle, board, { contains: [1, 2] }, 'row', 0)
      ).toBe(true);
      expect(
        isConstraintSatisfied(mockPuzzle, board, { contains: [9, 8] }, 'row', 0)
      ).toBe(false);
    });

    test('should validate range constraints correctly', () => {
      const board = [
        ['1', '2', '3', '4'],
        ['5', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];

      expect(
        isConstraintSatisfied(
          mockPuzzle,
          board,
          { range: { min: 1, max: 5 } },
          'row',
          0
        )
      ).toBe(true);
      expect(
        isConstraintSatisfied(
          mockPuzzle,
          board,
          { range: { min: 1, max: 3 } },
          'row',
          0
        )
      ).toBe(false);
    });

    test('should return false for incomplete rows/columns', () => {
      const incompleteBoard = [
        ['1', '2', '', ''],
        ['5', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];

      expect(
        isConstraintSatisfied(
          mockPuzzle,
          incompleteBoard,
          { sum: 10 },
          'row',
          0
        )
      ).toBe(false);
    });
  });

  describe('Puzzle Completion', () => {
    test('should detect completed puzzle', () => {
      const completedFeedback: FeedbackType[][] = [
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
      ];

      expect(isPuzzleComplete(completedFeedback)).toBe(true);
    });

    test('should detect incomplete puzzle', () => {
      const incompleteFeedback: FeedbackType[][] = [
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'none'],
      ];

      expect(isPuzzleComplete(incompleteFeedback)).toBe(false);
    });

    test('should detect puzzle with wrong guesses', () => {
      const wrongFeedback: FeedbackType[][] = [
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'wrong'],
      ];

      expect(isPuzzleComplete(wrongFeedback)).toBe(false);
    });
  });

  describe('Duplicate Detection', () => {
    test('should detect row duplicates', () => {
      const boardWithRowDuplicates = [
        ['1', '1', '3', '4'],
        ['5', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];

      const duplicates = getDuplicates(boardWithRowDuplicates);
      expect(duplicates.has('0,0')).toBe(true);
      expect(duplicates.has('0,1')).toBe(true);
    });

    test('should detect column duplicates', () => {
      const boardWithColDuplicates = [
        ['1', '2', '3', '4'],
        ['1', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];

      const duplicates = getDuplicates(boardWithColDuplicates);
      expect(duplicates.has('0,0')).toBe(true);
      expect(duplicates.has('1,0')).toBe(true);
    });

    test('should return empty set for valid board', () => {
      const validBoard = [
        ['1', '2', '3', '4'],
        ['5', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];

      const duplicates = getDuplicates(validBoard);
      expect(duplicates.size).toBe(0);
    });
  });

  describe('Board Management', () => {
    test('should create empty board correctly', () => {
      const board = emptyBoard();
      expect(board).toHaveLength(4);
      board.forEach(row => {
        expect(row).toHaveLength(4);
        row.forEach(cell => expect(cell).toBe(''));
      });
    });

    test('should convert starting board correctly', () => {
      const startingBoard = [
        [1, null, 3, null],
        [null, 6, null, 8],
        [9, null, null, 12],
        [null, 15, 16, null],
      ];

      const expected = [
        ['1', '', '3', ''],
        ['', '6', '', '8'],
        ['9', '', '', '12'],
        ['', '15', '16', ''],
      ];

      expect(startingBoardToBoard(startingBoard)).toEqual(expected);
    });
  });

  describe('Scoring System', () => {
    test('should calculate running score correctly', () => {
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
        firstTimeCorrectRows: 2,
        firstTimeCorrectCols: 1,
        firstTimeCorrectCells: 8,
        timeInSeconds: 60,
      };

      const score = calculateRunningScore(mockPuzzle, feedback, gameStats);
      const expectedScore = 16 * 50 + (2 + 1) * 100; // 800 + 300 = 1100
      expect(score).toBe(expectedScore);
    });

    test('should calculate final score with all bonuses', () => {
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

      expect(scoreBreakdown.timeBonus).toBe(500);
      expect(scoreBreakdown.perfectAccuracyBonus).toBe(300);
      expect(scoreBreakdown.efficiencyBonus).toBe(200);
      expect(scoreBreakdown.firstTimeCorrectBonus).toBe(300);
      expect(scoreBreakdown.difficultyMultiplier).toBe(1.8);
    });

    test('should handle imperfect game correctly', () => {
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
        firstTimeCorrectRows: 0,
        firstTimeCorrectCols: 0,
        firstTimeCorrectCells: 0,
        timeInSeconds: 300,
      };

      const scoreBreakdown = calculateScore(mockPuzzle, feedback, gameStats);

      expect(scoreBreakdown.perfectAccuracyBonus).toBe(0);
      expect(scoreBreakdown.efficiencyBonus).toBe(0);
      expect(scoreBreakdown.timeBonus).toBe(0);
    });
  });

  describe('Time Formatting', () => {
    test('should format time correctly', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(90)).toBe('1:30');
      expect(formatTime(125)).toBe('2:05');
      expect(formatTime(360)).toBe('6:00');
    });
  });
});
