import { PuzzleGenerator } from '../utils/puzzleGenerator';

// Helper function to get constraint type
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

    // Count pre-filled cells (non-null values)
    const preFilledCells = puzzle.startingBoard
      .flat()
      .filter(cell => cell !== null);

    expect(preFilledCells.length).toBeGreaterThanOrEqual(4);
    expect(preFilledCells.length).toBeLessThanOrEqual(5);
  });

  test('should use only digits 1-9', () => {
    const puzzle = puzzleGenerator.generatePuzzle();

    // Check solution uses only 1-9
    puzzle.solution.forEach(row => {
      row.forEach(cell => {
        expect(cell).toBeGreaterThanOrEqual(1);
        expect(cell).toBeLessThanOrEqual(9);
      });
    });

    // Check starting board uses only 1-9
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

    // Check rows with contains constraints
    const rowsWithContains = puzzle.rowConstraints
      .map((constraint, index) => ({ constraint, index }))
      .filter(({ constraint }) => constraint.contains);

    rowsWithContains.forEach(({ index }) => {
      const hasPreFilled = puzzle.startingBoard[index].some(
        cell => cell !== null
      );
      expect(hasPreFilled).toBe(false);
    });

    // Check columns with contains constraints
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
});
