import { PuzzleGenerator } from '../utils/puzzleGenerator';

function getConstraintType(constraint: any): string {
  if (constraint.sum !== undefined) return 'sum';
  if (constraint.even === true) return 'even';
  if (constraint.even === false) return 'odd';
  if (constraint.contains) return 'contains';
  if (constraint.range) return 'range';
  return 'unknown';
}

describe('PuzzleGenerator', () => {
  let puzzleGenerator: PuzzleGenerator;

  beforeEach(() => {
    puzzleGenerator = new PuzzleGenerator();
  });

  test('should have 4-5 pre-filled cells in starting board', () => {
    const puzzle = puzzleGenerator.generatePuzzle();

    const preFilledCells = puzzle.startingBoard
      .flat()
      .filter(cell => cell !== null);

    expect(preFilledCells.length).toBeGreaterThanOrEqual(4);
    expect(preFilledCells.length).toBeLessThanOrEqual(5);
  });

  test('should use only digits 1-9', () => {
    const puzzle = puzzleGenerator.generatePuzzle();

    puzzle.solution.forEach(row => {
      row.forEach(cell => {
        expect(cell).toBeGreaterThanOrEqual(1);
        expect(cell).toBeLessThanOrEqual(9);
      });
    });

    const preFilledCells = puzzle.startingBoard
      .flat()
      .filter(cell => cell !== null);
    preFilledCells.forEach(cell => {
      expect(cell).toBeGreaterThanOrEqual(1);
      expect(cell).toBeLessThanOrEqual(9);
    });
  });

  test('should have valid constraint types', () => {
    const puzzle = puzzleGenerator.generatePuzzle();
    const allConstraints = [...puzzle.rowConstraints, ...puzzle.colConstraints];

    allConstraints.forEach(constraint => {
      const type = getConstraintType(constraint);
      expect(['sum', 'even', 'odd', 'contains', 'range']).toContain(type);
    });
  });

  test('should have exactly 8 constraints total', () => {
    const puzzle = puzzleGenerator.generatePuzzle();
    const allConstraints = [...puzzle.rowConstraints, ...puzzle.colConstraints];

    expect(allConstraints.length).toBe(8);
    expect(puzzle.rowConstraints.length).toBe(4);
    expect(puzzle.colConstraints.length).toBe(4);
  });

  test('should generate consistent puzzles for the same date', () => {
    const puzzle1 = puzzleGenerator.generatePuzzle('2024-01-01');
    const puzzle2 = puzzleGenerator.generatePuzzle('2024-01-01');

    expect(JSON.stringify(puzzle1)).toBe(JSON.stringify(puzzle2));
  });

  test('should generate different puzzles for different dates', () => {
    const puzzle1 = puzzleGenerator.generatePuzzle('2024-01-01');
    const puzzle2 = puzzleGenerator.generatePuzzle('2024-01-02');

    expect(JSON.stringify(puzzle1)).not.toBe(JSON.stringify(puzzle2));
  });

  test('should have contains constraints only when no pre-filled cells', () => {
    const puzzle = puzzleGenerator.generatePuzzle();

    const rowsWithContains = puzzle.rowConstraints
      .map((constraint, index) => ({ constraint, index }))
      .filter(({ constraint }) => constraint.contains);

    rowsWithContains.forEach(({ index }) => {
      const hasPreFilled = puzzle.startingBoard[index].some(
        cell => cell !== null
      );
      expect(hasPreFilled).toBe(false);
    });

    const colsWithContains = puzzle.colConstraints
      .map((constraint, index) => ({ constraint, index }))
      .filter(({ constraint }) => constraint.contains);

    colsWithContains.forEach(({ index }) => {
      const hasPreFilled = puzzle.startingBoard.some(
        row => row[index] !== null
      );
      expect(hasPreFilled).toBe(false);
    });
  });

  test('should generate valid solution grid', () => {
    const puzzle = puzzleGenerator.generatePuzzle();

    // Check that solution is 4x4
    expect(puzzle.solution).toHaveLength(4);
    puzzle.solution.forEach(row => {
      expect(row).toHaveLength(4);
    });

    // Check that all numbers are 1-9
    puzzle.solution.forEach(row => {
      row.forEach(cell => {
        expect(cell).toBeGreaterThanOrEqual(1);
        expect(cell).toBeLessThanOrEqual(9);
      });
    });
  });

  test('should generate valid starting board', () => {
    const puzzle = puzzleGenerator.generatePuzzle();

    // Check that starting board is 4x4
    expect(puzzle.startingBoard).toHaveLength(4);
    puzzle.startingBoard.forEach(row => {
      expect(row).toHaveLength(4);
    });

    // Check that pre-filled cells match solution
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const startingCell = puzzle.startingBoard[row][col];
        const solutionCell = puzzle.solution[row][col];
        if (startingCell !== null) {
          expect(startingCell).toBe(solutionCell);
        }
      }
    }
  });

  test('should generate valid constraints', () => {
    const puzzle = puzzleGenerator.generatePuzzle();

    // Check row constraints
    expect(puzzle.rowConstraints).toHaveLength(4);
    puzzle.rowConstraints.forEach(constraint => {
      expect(constraint).toBeDefined();
      const hasValidProperty =
        constraint.sum !== undefined ||
        constraint.even !== undefined ||
        constraint.contains !== undefined ||
        constraint.range !== undefined;
      expect(hasValidProperty).toBe(true);
    });

    // Check column constraints
    expect(puzzle.colConstraints).toHaveLength(4);
    puzzle.colConstraints.forEach(constraint => {
      expect(constraint).toBeDefined();
      const hasValidProperty =
        constraint.sum !== undefined ||
        constraint.even !== undefined ||
        constraint.contains !== undefined ||
        constraint.range !== undefined;
      expect(hasValidProperty).toBe(true);
    });
  });

  test('should validate sum constraints', () => {
    const puzzle = puzzleGenerator.generatePuzzle();

    puzzle.rowConstraints.forEach((constraint, rowIndex) => {
      if (constraint.sum) {
        const rowSum = puzzle.solution[rowIndex].reduce(
          (sum, cell) => sum + cell,
          0
        );
        expect(rowSum).toBe(constraint.sum);
      }
    });

    puzzle.colConstraints.forEach((constraint, colIndex) => {
      if (constraint.sum) {
        const colSum = puzzle.solution.reduce(
          (sum, row) => sum + row[colIndex],
          0
        );
        expect(colSum).toBe(constraint.sum);
      }
    });
  });

  test('should validate even/odd constraints', () => {
    const puzzle = puzzleGenerator.generatePuzzle();

    puzzle.rowConstraints.forEach((constraint, rowIndex) => {
      if (constraint.even === true) {
        const allEven = puzzle.solution[rowIndex].every(cell => cell % 2 === 0);
        expect(allEven).toBe(true);
      } else if (constraint.even === false) {
        const allOdd = puzzle.solution[rowIndex].every(cell => cell % 2 === 1);
        expect(allOdd).toBe(true);
      }
    });

    puzzle.colConstraints.forEach((constraint, colIndex) => {
      if (constraint.even === true) {
        const allEven = puzzle.solution.every(row => row[colIndex] % 2 === 0);
        expect(allEven).toBe(true);
      } else if (constraint.even === false) {
        const allOdd = puzzle.solution.every(row => row[colIndex] % 2 === 1);
        expect(allOdd).toBe(true);
      }
    });
  });

  test('should validate contains constraints', () => {
    const puzzle = puzzleGenerator.generatePuzzle();

    puzzle.rowConstraints.forEach((constraint, rowIndex) => {
      if (constraint.contains) {
        const rowNumbers = puzzle.solution[rowIndex];
        constraint.contains.forEach(requiredNum => {
          expect(rowNumbers).toContain(requiredNum);
        });
      }
    });

    puzzle.colConstraints.forEach((constraint, colIndex) => {
      if (constraint.contains) {
        const colNumbers = puzzle.solution.map(row => row[colIndex]);
        constraint.contains.forEach(requiredNum => {
          expect(colNumbers).toContain(requiredNum);
        });
      }
    });
  });

  test('should validate range constraints', () => {
    const puzzle = puzzleGenerator.generatePuzzle();

    puzzle.rowConstraints.forEach((constraint, rowIndex) => {
      if (constraint.range) {
        const rowNumbers = puzzle.solution[rowIndex];
        rowNumbers.forEach(num => {
          expect(num).toBeGreaterThanOrEqual(constraint.range!.min);
          expect(num).toBeLessThanOrEqual(constraint.range!.max);
        });
      }
    });

    puzzle.colConstraints.forEach((constraint, colIndex) => {
      if (constraint.range) {
        const colNumbers = puzzle.solution.map(row => row[colIndex]);
        colNumbers.forEach(num => {
          expect(num).toBeGreaterThanOrEqual(constraint.range!.min);
          expect(num).toBeLessThanOrEqual(constraint.range!.max);
        });
      }
    });
  });

  test('should generate different puzzles for different seeds', () => {
    const puzzle1 = puzzleGenerator.generatePuzzle('2024-01-01');
    const puzzle2 = puzzleGenerator.generatePuzzle('2024-01-02');
    const puzzle3 = puzzleGenerator.generatePuzzle('2024-01-03');

    const hash1 = JSON.stringify(puzzle1);
    const hash2 = JSON.stringify(puzzle2);
    const hash3 = JSON.stringify(puzzle3);

    expect(hash1).not.toBe(hash2);
    expect(hash2).not.toBe(hash3);
    expect(hash1).not.toBe(hash3);
  });

  test('should handle edge case dates', () => {
    // Test with leap year date
    const leapYearPuzzle = puzzleGenerator.generatePuzzle('2024-02-29');
    expect(leapYearPuzzle.date).toBe('2024-02-29');
    expect(leapYearPuzzle.solution).toHaveLength(4);

    // Test with year boundary
    const yearBoundaryPuzzle = puzzleGenerator.generatePuzzle('2023-12-31');
    expect(yearBoundaryPuzzle.date).toBe('2023-12-31');
    expect(yearBoundaryPuzzle.solution).toHaveLength(4);
  });

  test('should generate getTodaysPuzzle correctly', () => {
    const todayPuzzle = puzzleGenerator.getTodaysPuzzle();
    const today = new Date().toISOString().split('T')[0];

    expect(todayPuzzle.date).toBe(today);
    expect(todayPuzzle.solution).toHaveLength(4);
    expect(todayPuzzle.startingBoard).toHaveLength(4);
    expect(todayPuzzle.rowConstraints).toHaveLength(4);
    expect(todayPuzzle.colConstraints).toHaveLength(4);
  });
});
