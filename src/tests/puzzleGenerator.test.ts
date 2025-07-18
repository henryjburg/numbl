import { puzzleGenerator } from '../utils/puzzleGenerator';

// Helper function to get constraint type
function getConstraintType(constraint: any): string {
  if (constraint.sum !== undefined) return 'sum';
  if (constraint.onlyOdd) return 'odds';
  if (constraint.onlyEven) return 'evens';
  if (constraint.range) return 'range';
  if (constraint.contains) return 'contains';
  if (constraint.order) return 'order';
  if (constraint.consecutive) return 'consecutive';
  if (constraint.fibonacci) return 'fibonacci';
  if (constraint.prime) return 'prime';
  if (constraint.square) return 'square';
  if (constraint.unique) return 'unique';
  return 'unknown';
}

describe('PuzzleGenerator', () => {
  test('should not have more than 2 occurrences of the same constraint type', () => {
    const puzzle = puzzleGenerator.generatePuzzle();

    // Collect all constraints
    const allConstraints = [...puzzle.rowConstraints, ...puzzle.colConstraints];

    // Count constraint types
    const constraintCounts: { [key: string]: number } = {};

    allConstraints.forEach(constraint => {
      const type = getConstraintType(constraint);
      constraintCounts[type] = (constraintCounts[type] || 0) + 1;
    });

    // Check if any constraint appears more than 2 times
    const hasTooMany = Object.values(constraintCounts).some(count => count > 2);

    expect(hasTooMany).toBe(false);
  });

  test('should have exactly 2 sum constraints', () => {
    const puzzle = puzzleGenerator.generatePuzzle();

    // Collect all constraints
    const allConstraints = [...puzzle.rowConstraints, ...puzzle.colConstraints];

    // Count sum constraints
    const sumConstraints = allConstraints.filter(constraint => constraint.sum !== undefined);

    expect(sumConstraints.length).toBe(2);
  });

  test('should maintain constraint distribution limit across multiple dates', () => {
    const dates = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];

    dates.forEach(date => {
      const puzzle = puzzleGenerator.generatePuzzle(date);
      const allConstraints = [...puzzle.rowConstraints, ...puzzle.colConstraints];

      const constraintCounts: { [key: string]: number } = {};
      allConstraints.forEach(constraint => {
        const type = getConstraintType(constraint);
        constraintCounts[type] = (constraintCounts[type] || 0) + 1;
      });

      const hasTooMany = Object.values(constraintCounts).some(count => count > 2);
      expect(hasTooMany).toBe(false);
    });
  });

    test('should have exactly 2 sum constraints across multiple dates', () => {
    const dates = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];

    dates.forEach(date => {
      const puzzle = puzzleGenerator.generatePuzzle(date);
      const allConstraints = [...puzzle.rowConstraints, ...puzzle.colConstraints];

      // Count sum constraints
      const sumConstraints = allConstraints.filter(constraint => constraint.sum !== undefined);

      expect(sumConstraints.length).toBe(2);
    });
  });

  test('should have exactly 4 pre-filled cells in starting board', () => {
    const puzzle = puzzleGenerator.generatePuzzle();

    // Count pre-filled cells (non-null values)
    const preFilledCells = puzzle.startingBoard.flat().filter(cell => cell !== null);

    expect(preFilledCells.length).toBe(4);
  });

      test('should have exactly 4 pre-filled cells across multiple dates', () => {
    const dates = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];

    dates.forEach(date => {
      const puzzle = puzzleGenerator.generatePuzzle(date);

      // Count pre-filled cells (non-null values)
      const preFilledCells = puzzle.startingBoard.flat().filter(cell => cell !== null);

      expect(preFilledCells.length).toBe(4);
    });
  });

  test('should have pre-filled cells with no more than 2 per row or column', () => {
    const puzzle = puzzleGenerator.generatePuzzle();

    // Find positions of pre-filled cells
    const preFilledPositions: Array<{row: number, col: number}> = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (puzzle.startingBoard[row][col] !== null) {
          preFilledPositions.push({row, col});
        }
      }
    }

    // Check that we have exactly 4 positions
    expect(preFilledPositions.length).toBe(4);

    // Check that no more than 2 cells are in the same row or column
    const rowCounts = new Map<number, number>();
    const colCounts = new Map<number, number>();

    preFilledPositions.forEach(({row, col}) => {
      const currentRowCount = rowCounts.get(row) || 0;
      const currentColCount = colCounts.get(col) || 0;

      rowCounts.set(row, currentRowCount + 1);
      colCounts.set(col, currentColCount + 1);
    });

    // Verify no row or column has more than 2 pre-filled cells
    for (let row = 0; row < 4; row++) {
      const rowCount = rowCounts.get(row) || 0;
      expect(rowCount).toBeLessThanOrEqual(2);
    }

    for (let col = 0; col < 4; col++) {
      const colCount = colCounts.get(col) || 0;
      expect(colCount).toBeLessThanOrEqual(2);
    }
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
});
