import { Puzzle, Constraint, ConstraintType } from '../types/puzzle';

// Universal date for seeding - you can change this to any fixed date
const UNIVERSAL_DATE = '2024-01-01';

export class PuzzleGenerator {
  private seed: number;

  constructor(date: string = new Date().toISOString().split('T')[0]) {
    this.seed = this.generateSeedFromDate(date);
  }

  private generateSeedFromDate(date: string): number {
    const dateObj = new Date(date);
    const universalDate = new Date(UNIVERSAL_DATE);
    const daysDiff = Math.floor(
      (dateObj.getTime() - universalDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Create a deterministic seed from the date
    let seed = 0;
    for (let i = 0; i < date.length; i++) {
      seed = (seed << 5) - seed + date.charCodeAt(i);
      seed = seed & seed; // Convert to 32-bit integer
    }
    return seed + daysDiff;
  }

  private seededRandom(): number {
    // Simple seeded random number generator
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  private shuffleArray<T>(array: T[]): T[] {
    if (!array || array.length === 0) {
      return [];
    }
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.seededRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateRandomGrid(): number[][] {
    // Generate numbers 1-9 in random order
    const numbers = Array.from({ length: 9 }, (_, i) => i + 1);
    const shuffledNumbers = this.shuffleArray(numbers);

    // Arrange into 4x4 grid (we'll use 9 numbers, some will be repeated)
    const grid: number[][] = [];
    for (let i = 0; i < 4; i++) {
      grid[i] = [];
      for (let j = 0; j < 4; j++) {
        const index = (i * 4 + j) % 9;
        grid[i][j] = shuffledNumbers[index];
      }
    }

    return grid;
  }

  private generateStrategicStartingBoard(
    solution: number[][],
    rowConstraints: Constraint[],
    colConstraints: Constraint[]
  ): (number | null)[][] {
    // Create a starting board with 4 strategic pre-filled cells
    const startingBoard: (number | null)[][] = solution.map(row =>
      row.map(() => null)
    );

    // Strategy: Pre-fill cells that help with the most challenging constraints
    const positions: Array<{ row: number; col: number; priority: number }> = [];

    // Calculate priority for each position based on constraint complexity
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        let priority = 0;

        // Higher priority for cells that help with complex constraints
        const rowConstraint = rowConstraints[row];
        const colConstraint = colConstraints[col];

        // Don't pre-fill cells in rows/columns with contains constraints
        if (rowConstraint.contains || colConstraint.contains) {
          continue; // Skip this position entirely
        }

        if (rowConstraint.range || colConstraint.range) priority += 2;
        if (
          rowConstraint.even !== undefined ||
          colConstraint.even !== undefined
        )
          priority += 1;

        // Bonus for corner cells (they affect both row and column)
        if ((row === 0 || row === 3) && (col === 0 || col === 3)) {
          priority += 2;
        }

        positions.push({ row, col, priority });
      }
    }

    // Sort by priority (highest first) and take the top 4
    positions.sort((a, b) => b.priority - a.priority);

    for (let i = 0; i < 4 && i < positions.length; i++) {
      const position = positions[i];
      startingBoard[position.row][position.col] =
        solution[position.row][position.col];
    }

    return startingBoard;
  }

  private generateConstraint(
    numbers: number[],
    hasPreFilled: boolean,
    usedConstraints: Set<string>
  ): { constraint: Constraint; type: string } {
    const sum = numbers.reduce((a, b) => a + b, 0);
    const evens = numbers.filter(n => n % 2 === 0).length;
    const uniqueNumbers = Array.from(new Set(numbers));
    const minNum = Math.min(...numbers);
    const maxNum = Math.max(...numbers);

    // Collect all possible constraints with more flexible conditions
    const availableConstraints: Array<{
      constraint: Constraint;
      type: string;
    }> = [];

    // Sum constraint is always available
    availableConstraints.push({ constraint: { sum }, type: 'sum' });

    // Even constraint - only create if ALL numbers are even or ALL are odd
    if (evens === 4) {
      availableConstraints.push({ constraint: { even: true }, type: 'even' });
    } else if (evens === 0) {
      availableConstraints.push({ constraint: { even: false }, type: 'odd' });
    }

    // Contains constraint - more flexible: available if we have at least 2 unique numbers
    if (uniqueNumbers.length >= 2) {
      const shuffled = this.shuffleArray(uniqueNumbers);
      availableConstraints.push({
        constraint: { contains: [shuffled[0], shuffled[1]] },
        type: 'contains',
      });
    }

    // Range constraints - create meaningful ranges based on the numbers
    const rangeSize = maxNum - minNum + 1;
    if (rangeSize <= 5) {
      // Only create range constraints for reasonably sized ranges
      availableConstraints.push({
        constraint: { range: { min: minNum, max: maxNum } },
        type: 'range',
      });
    }

    // Ensure we always have at least one constraint (sum is always available)
    if (availableConstraints.length === 0) {
      return { constraint: { sum }, type: 'sum' };
    }

    // Filter out already used constraint types to maximize diversity
    const unusedConstraints = availableConstraints.filter(
      c => !usedConstraints.has(c.type)
    );

    // If we have unused constraint types, prefer those
    if (unusedConstraints.length > 0) {
      const randomIndex = Math.floor(
        this.seededRandom() * unusedConstraints.length
      );
      if (randomIndex >= 0 && randomIndex < unusedConstraints.length) {
        return unusedConstraints[randomIndex];
      }
    }

    // Otherwise, choose from all available constraints
    const randomIndex = Math.floor(
      this.seededRandom() * availableConstraints.length
    );
    if (randomIndex >= 0 && randomIndex < availableConstraints.length) {
      return availableConstraints[randomIndex];
    }

    // Fallback to first available constraint
    return availableConstraints[0];
  }

  public generatePuzzle(
    date: string = new Date().toISOString().split('T')[0]
  ): Puzzle {
    // Update seed for the specific date
    this.seed = this.generateSeedFromDate(date);

    // Generate random solution
    const solution = this.generateRandomGrid();

    // Generate constraints for rows and columns first
    const rowConstraints: Constraint[] = [];
    const colConstraints: Constraint[] = [];
    const usedConstraintTypes: Set<string> = new Set();

    // Generate row constraints
    for (let i = 0; i < 4; i++) {
      const rowNumbers = solution[i];
      const constraintResult = this.generateConstraint(
        rowNumbers,
        false,
        usedConstraintTypes
      );
      rowConstraints.push(constraintResult.constraint);
      usedConstraintTypes.add(constraintResult.type);
    }

    // Generate column constraints
    for (let i = 0; i < 4; i++) {
      const colNumbers = solution.map(row => row[i]);
      const constraintResult = this.generateConstraint(
        colNumbers,
        false,
        usedConstraintTypes
      );
      colConstraints.push(constraintResult.constraint);
      usedConstraintTypes.add(constraintResult.type);
    }

    // Now choose strategic pre-filled cells based on constraints
    const startingBoard = this.generateStrategicStartingBoard(
      solution,
      rowConstraints,
      colConstraints
    );

    return {
      solution,
      startingBoard,
      rowConstraints,
      colConstraints,
      date,
    };
  }

  public getTodaysPuzzle(): Puzzle {
    return this.generatePuzzle(new Date().toISOString().split('T')[0]);
  }
}
