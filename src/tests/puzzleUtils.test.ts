import {
  getConstraintName,
  getConstraintValue,
  getConstraintType,
  isConstraintSatisfied,
  isConstraintGuessedCorrect,
  isPuzzleComplete,
  getDuplicates,
  hasDuplicatesInLine,
  generatePuzzleHash,
  emptyBoard,
  startingBoardToBoard,
} from '../utils/puzzleUtils';
import { Puzzle, Constraint, FeedbackType } from '../types/puzzle';

describe('puzzleUtils', () => {
  describe('getConstraintName', () => {
    test('should return "Sum" for sum constraint', () => {
      const constraint: Constraint = { sum: 20 };
      expect(getConstraintName(constraint)).toBe('Sum');
    });

    test('should return "Even" for even constraint', () => {
      const constraint: Constraint = { even: true };
      expect(getConstraintName(constraint)).toBe('Even');
    });

    test('should return "Odd" for odd constraint', () => {
      const constraint: Constraint = { even: false };
      expect(getConstraintName(constraint)).toBe('Odd');
    });

    test('should return "Contains" for contains constraint', () => {
      const constraint: Constraint = { contains: [1, 2] };
      expect(getConstraintName(constraint)).toBe('Contains');
    });

    test('should return "Range" for range constraint', () => {
      const constraint: Constraint = { range: { min: 1, max: 5 } };
      expect(getConstraintName(constraint)).toBe('Range');
    });

    test('should return empty string for unknown constraint', () => {
      const constraint: Constraint = {};
      expect(getConstraintName(constraint)).toBe('');
    });
  });

  describe('getConstraintValue', () => {
    test('should return sum value as string', () => {
      const constraint: Constraint = { sum: 20 };
      expect(getConstraintValue(constraint)).toBe('20');
    });

    test('should return "All Even" for even constraint', () => {
      const constraint: Constraint = { even: true };
      expect(getConstraintValue(constraint)).toBe('All Even');
    });

    test('should return "All Odd" for odd constraint', () => {
      const constraint: Constraint = { even: false };
      expect(getConstraintValue(constraint)).toBe('All Odd');
    });

    test('should return sorted contains values', () => {
      const constraint: Constraint = { contains: [3, 1, 2] };
      expect(getConstraintValue(constraint)).toBe('1, 2, 3');
    });

    test('should return range as min-max', () => {
      const constraint: Constraint = { range: { min: 1, max: 5 } };
      expect(getConstraintValue(constraint)).toBe('1-5');
    });

    test('should return empty string for unknown constraint', () => {
      const constraint: Constraint = {};
      expect(getConstraintValue(constraint)).toBe('');
    });
  });

  describe('getConstraintType', () => {
    test('should return "sum" for sum constraint', () => {
      const constraint: Constraint = { sum: 20 };
      expect(getConstraintType(constraint)).toBe('sum');
    });

    test('should return "even" for even constraint', () => {
      const constraint: Constraint = { even: true };
      expect(getConstraintType(constraint)).toBe('even');
    });

    test('should return "odd" for odd constraint', () => {
      const constraint: Constraint = { even: false };
      expect(getConstraintType(constraint)).toBe('odd');
    });

    test('should return "contains" for contains constraint', () => {
      const constraint: Constraint = { contains: [1, 2] };
      expect(getConstraintType(constraint)).toBe('contains');
    });

    test('should return "range" for range constraint', () => {
      const constraint: Constraint = { range: { min: 1, max: 5 } };
      expect(getConstraintType(constraint)).toBe('range');
    });

    test('should return "sum" as default for unknown constraint', () => {
      const constraint: Constraint = {};
      expect(getConstraintType(constraint)).toBe('sum');
    });
  });

  describe('isConstraintSatisfied', () => {
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

    test('should return true for satisfied sum constraint', () => {
      const constraint: Constraint = { sum: 10 };
      const board = [
        ['1', '2', '3', '4'],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
      ];
      expect(
        isConstraintSatisfied(mockPuzzle, board, constraint, 'row', 0)
      ).toBe(true);
    });

    test('should return false for unsatisfied sum constraint', () => {
      const constraint: Constraint = { sum: 20 };
      const board = [
        ['1', '2', '3', '4'],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
      ];
      expect(
        isConstraintSatisfied(mockPuzzle, board, constraint, 'row', 0)
      ).toBe(false);
    });

    test('should return false for incomplete row', () => {
      const constraint: Constraint = { sum: 10 };
      const board = [
        ['1', '2', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
      ];
      expect(
        isConstraintSatisfied(mockPuzzle, board, constraint, 'row', 0)
      ).toBe(false);
    });

    test('should return true for satisfied even constraint', () => {
      const constraint: Constraint = { even: true };
      const board = [
        ['2', '4', '6', '8'],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
      ];
      expect(
        isConstraintSatisfied(mockPuzzle, board, constraint, 'row', 0)
      ).toBe(true);
    });

    test('should return false for unsatisfied even constraint', () => {
      const constraint: Constraint = { even: true };
      const board = [
        ['1', '2', '3', '4'],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
      ];
      expect(
        isConstraintSatisfied(mockPuzzle, board, constraint, 'row', 0)
      ).toBe(false);
    });

    test('should return true for satisfied odd constraint', () => {
      const constraint: Constraint = { even: false };
      const board = [
        ['1', '3', '5', '7'],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
      ];
      expect(
        isConstraintSatisfied(mockPuzzle, board, constraint, 'row', 0)
      ).toBe(true);
    });

    test('should return true for satisfied contains constraint', () => {
      const constraint: Constraint = { contains: [1, 3] };
      const board = [
        ['1', '2', '3', '4'],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
      ];
      expect(
        isConstraintSatisfied(mockPuzzle, board, constraint, 'row', 0)
      ).toBe(true);
    });

    test('should return false for unsatisfied contains constraint', () => {
      const constraint: Constraint = { contains: [9, 8] };
      const board = [
        ['1', '2', '3', '4'],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
      ];
      expect(
        isConstraintSatisfied(mockPuzzle, board, constraint, 'row', 0)
      ).toBe(false);
    });

    test('should return true for satisfied range constraint', () => {
      const constraint: Constraint = { range: { min: 1, max: 5 } };
      const board = [
        ['1', '2', '3', '4'],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
      ];
      expect(
        isConstraintSatisfied(mockPuzzle, board, constraint, 'row', 0)
      ).toBe(true);
    });

    test('should return false for unsatisfied range constraint', () => {
      const constraint: Constraint = { range: { min: 1, max: 3 } };
      const board = [
        ['1', '2', '3', '4'],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
      ];
      expect(
        isConstraintSatisfied(mockPuzzle, board, constraint, 'row', 0)
      ).toBe(false);
    });

    test('should work with column constraints', () => {
      const constraint: Constraint = { sum: 10 };
      const board = [
        ['1', '', '', ''],
        ['2', '', '', ''],
        ['3', '', '', ''],
        ['4', '', '', ''],
      ];
      expect(
        isConstraintSatisfied(mockPuzzle, board, constraint, 'col', 0)
      ).toBe(true);
    });
  });

  describe('isConstraintGuessedCorrect', () => {
    test('should return true when all cells in row are correct', () => {
      const feedback: FeedbackType[][] = [
        ['correct', 'correct', 'correct', 'correct'],
        ['none', 'none', 'none', 'none'],
        ['none', 'none', 'none', 'none'],
        ['none', 'none', 'none', 'none'],
      ];
      expect(isConstraintGuessedCorrect(feedback, 'row', 0)).toBe(true);
    });

    test('should return false when any cell in row is not correct', () => {
      const feedback: FeedbackType[][] = [
        ['correct', 'correct', 'wrong', 'correct'],
        ['none', 'none', 'none', 'none'],
        ['none', 'none', 'none', 'none'],
        ['none', 'none', 'none', 'none'],
      ];
      expect(isConstraintGuessedCorrect(feedback, 'row', 0)).toBe(false);
    });

    test('should work with column constraints', () => {
      const feedback: FeedbackType[][] = [
        ['correct', 'none', 'none', 'none'],
        ['correct', 'none', 'none', 'none'],
        ['correct', 'none', 'none', 'none'],
        ['correct', 'none', 'none', 'none'],
      ];
      expect(isConstraintGuessedCorrect(feedback, 'col', 0)).toBe(true);
    });
  });

  describe('isPuzzleComplete', () => {
    test('should return true when all cells are correct', () => {
      const feedback: FeedbackType[][] = [
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
      ];
      expect(isPuzzleComplete(feedback)).toBe(true);
    });

    test('should return false when any cell is not correct', () => {
      const feedback: FeedbackType[][] = [
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'wrong'],
      ];
      expect(isPuzzleComplete(feedback)).toBe(false);
    });

    test('should return false when any cell is none', () => {
      const feedback: FeedbackType[][] = [
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'none'],
      ];
      expect(isPuzzleComplete(feedback)).toBe(false);
    });
  });

  describe('getDuplicates', () => {
    test('should return empty set for board with no duplicates', () => {
      const board = [
        ['1', '2', '3', '4'],
        ['5', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];
      const duplicates = getDuplicates(board);
      expect(duplicates.size).toBe(0);
    });

    test('should detect row duplicates', () => {
      const board = [
        ['1', '1', '3', '4'],
        ['5', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];
      const duplicates = getDuplicates(board);
      expect(duplicates.has('0,0')).toBe(true);
      expect(duplicates.has('0,1')).toBe(true);
    });

    test('should detect column duplicates', () => {
      const board = [
        ['1', '2', '3', '4'],
        ['1', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];
      const duplicates = getDuplicates(board);
      expect(duplicates.has('0,0')).toBe(true);
      expect(duplicates.has('1,0')).toBe(true);
    });

    test('should detect both row and column duplicates', () => {
      const board = [
        ['1', '1', '3', '4'],
        ['1', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];
      const duplicates = getDuplicates(board);
      expect(duplicates.has('0,0')).toBe(true);
      expect(duplicates.has('0,1')).toBe(true);
      expect(duplicates.has('1,0')).toBe(true);
    });

    test('should ignore empty cells', () => {
      const board = [
        ['1', '', '3', '4'],
        ['5', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];
      const duplicates = getDuplicates(board);
      expect(duplicates.size).toBe(0);
    });
  });

  describe('hasDuplicatesInLine', () => {
    test('should return false for row with no duplicates', () => {
      const board = [
        ['1', '2', '3', '4'],
        ['5', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];
      expect(hasDuplicatesInLine(board, 'row', 0)).toBe(false);
    });

    test('should return true for row with duplicates', () => {
      const board = [
        ['1', '1', '3', '4'],
        ['5', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];
      expect(hasDuplicatesInLine(board, 'row', 0)).toBe(true);
    });

    test('should return false for column with no duplicates', () => {
      const board = [
        ['1', '2', '3', '4'],
        ['5', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];
      expect(hasDuplicatesInLine(board, 'col', 0)).toBe(false);
    });

    test('should return true for column with duplicates', () => {
      const board = [
        ['1', '2', '3', '4'],
        ['1', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];
      expect(hasDuplicatesInLine(board, 'col', 0)).toBe(true);
    });

    test('should ignore empty cells', () => {
      const board = [
        ['1', '', '3', '4'],
        ['5', '6', '7', '8'],
        ['9', '1', '2', '3'],
        ['4', '5', '6', '7'],
      ];
      expect(hasDuplicatesInLine(board, 'row', 0)).toBe(false);
    });
  });

  describe('generatePuzzleHash', () => {
    test('should generate consistent hash for same puzzle', () => {
      const puzzle: Puzzle = {
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
          { range: { min: 1, max: 5 } },
        ],
        colConstraints: [
          { sum: 15 },
          { even: false },
          { contains: [3, 4] },
          { range: { min: 2, max: 6 } },
        ],
        date: '2024-01-01',
      };

      const hash1 = generatePuzzleHash(puzzle);
      const hash2 = generatePuzzleHash(puzzle);
      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different puzzles', () => {
      const puzzle1: Puzzle = {
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
          { range: { min: 1, max: 5 } },
        ],
        colConstraints: [
          { sum: 15 },
          { even: false },
          { contains: [3, 4] },
          { range: { min: 2, max: 6 } },
        ],
        date: '2024-01-01',
      };

      const puzzle2: Puzzle = {
        solution: [
          [2, 3, 4, 5],
          [6, 7, 8, 9],
          [1, 2, 3, 4],
          [5, 6, 7, 8],
        ],
        startingBoard: [
          [2, null, null, null],
          [null, 7, null, null],
          [null, null, 3, null],
          [null, null, null, 8],
        ],
        rowConstraints: [
          { sum: 14 },
          { even: true },
          { contains: [2, 3] },
          { range: { min: 2, max: 6 } },
        ],
        colConstraints: [
          { sum: 14 },
          { even: false },
          { contains: [4, 5] },
          { range: { min: 3, max: 7 } },
        ],
        date: '2024-01-01',
      };

      const hash1 = generatePuzzleHash(puzzle1);
      const hash2 = generatePuzzleHash(puzzle2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('emptyBoard', () => {
    test('should create 4x4 board with empty strings', () => {
      const board = emptyBoard();
      expect(board).toHaveLength(4);
      board.forEach(row => {
        expect(row).toHaveLength(4);
        row.forEach(cell => {
          expect(cell).toBe('');
        });
      });
    });
  });

  describe('startingBoardToBoard', () => {
    test('should convert starting board to string board', () => {
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

    test('should handle all null values', () => {
      const startingBoard = [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ];
      const expected = [
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
      ];
      expect(startingBoardToBoard(startingBoard)).toEqual(expected);
    });

    test('should handle all filled values', () => {
      const startingBoard = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
      ];
      const expected = [
        ['1', '2', '3', '4'],
        ['5', '6', '7', '8'],
        ['9', '10', '11', '12'],
        ['13', '14', '15', '16'],
      ];
      expect(startingBoardToBoard(startingBoard)).toEqual(expected);
    });
  });
});
