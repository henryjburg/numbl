import { Puzzle, Constraint, ConstraintType } from '../types/puzzle';

// Universal date for seeding - you can change this to any fixed date
const UNIVERSAL_DATE = '2024-01-01';

export class PuzzleGenerator {
  private seed: number;
  private constraintTypes: ConstraintType[];
  private constraintUsageCount: Map<string, number>;

  constructor(date: string = new Date().toISOString().split('T')[0]) {
    this.seed = this.generateSeedFromDate(date);
    this.constraintTypes = [
      { type: 'order', priority: 1, used: false },      // Most exotic - use whenever possible
      { type: 'consecutive', priority: 2, used: false }, // Very exotic - consecutive numbers
      { type: 'fibonacci', priority: 3, used: false },   // Very exotic - Fibonacci numbers
      { type: 'square', priority: 4, used: false },      // Very exotic - square numbers
      { type: 'prime', priority: 5, used: false },       // Very exotic - prime numbers
      { type: 'contains', priority: 6, used: false },    // Exotic - distinctive numbers
      { type: 'range', priority: 7, used: false },       // Exotic - notable min/max
      { type: 'evens', priority: 8, used: false },       // Interesting - majority even
      { type: 'odds', priority: 8, used: false },        // Interesting - majority odd
      { type: 'sum', priority: 999, used: false }        // Boring fallback - last resort
    ];
    this.constraintUsageCount = new Map();
  }

  private generateSeedFromDate(date: string): number {
    const dateObj = new Date(date);
    const universalDate = new Date(UNIVERSAL_DATE);
    const daysDiff = Math.floor((dateObj.getTime() - universalDate.getTime()) / (1000 * 60 * 60 * 24));

    // Create a deterministic seed from the date
    let seed = 0;
    for (let i = 0; i < date.length; i++) {
      seed = ((seed << 5) - seed) + date.charCodeAt(i);
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
    // Generate numbers 1-16 in random order
    const numbers = Array.from({ length: 16 }, (_, i) => i + 1);
    const shuffledNumbers = this.shuffleArray(numbers);

    // Arrange into 4x4 grid
    const grid: number[][] = [];
    for (let i = 0; i < 4; i++) {
      grid[i] = shuffledNumbers.slice(i * 4, (i + 1) * 4);
    }

    return grid;
  }

          private generateStartingBoard(solution: number[][]): (number | null)[][] {
    // Create a starting board with 4 pre-filled cells (25% of the puzzle)
    const startingBoard: (number | null)[][] = solution.map(row => row.map(() => null));

    // Generate positions for pre-filled cells, ensuring no more than 2 cells per row or column
    const positions: Array<{row: number, col: number}> = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        positions.push({row, col});
      }
    }

    // Shuffle positions
    const shuffledPositions = this.shuffleArray(positions);

    // Fill exactly 4 positions, ensuring no more than 2 cells per row or column
    let filledCount = 0;
    const rowCounts = new Map<number, number>();
    const colCounts = new Map<number, number>();

    for (let i = 0; i < shuffledPositions.length && filledCount < 4; i++) {
      const position = shuffledPositions[i];
      if (position && typeof position.row === 'number' && typeof position.col === 'number' &&
          position.row >= 0 && position.row < 4 && position.col >= 0 && position.col < 4) {

        const currentRowCount = rowCounts.get(position.row) || 0;
        const currentColCount = colCounts.get(position.col) || 0;

        // Check if we can add a cell here (max 2 per row/column)
        if (currentRowCount < 2 && currentColCount < 2) {
          startingBoard[position.row][position.col] = solution[position.row][position.col];
          rowCounts.set(position.row, currentRowCount + 1);
          colCounts.set(position.col, currentColCount + 1);
          filledCount++;
        }
      }
    }

    // If we still don't have 4 positions, try alternative positions
    if (filledCount < 4) {
      // Try different combinations of positions that respect the 2-per-row/column limit
      const alternativePositions = [
        [{row: 0, col: 0}, {row: 0, col: 1}, {row: 1, col: 2}, {row: 1, col: 3}],
        [{row: 0, col: 0}, {row: 0, col: 2}, {row: 1, col: 1}, {row: 1, col: 3}],
        [{row: 0, col: 0}, {row: 0, col: 3}, {row: 1, col: 1}, {row: 1, col: 2}],
        [{row: 0, col: 1}, {row: 0, col: 2}, {row: 1, col: 0}, {row: 1, col: 3}],
        [{row: 0, col: 1}, {row: 0, col: 3}, {row: 1, col: 0}, {row: 1, col: 2}],
        [{row: 0, col: 2}, {row: 0, col: 3}, {row: 1, col: 0}, {row: 1, col: 1}],
        [{row: 0, col: 0}, {row: 1, col: 0}, {row: 2, col: 1}, {row: 3, col: 1}],
        [{row: 0, col: 0}, {row: 1, col: 1}, {row: 2, col: 0}, {row: 3, col: 1}],
        [{row: 0, col: 0}, {row: 1, col: 1}, {row: 2, col: 2}, {row: 3, col: 3}],
        [{row: 0, col: 0}, {row: 1, col: 2}, {row: 2, col: 1}, {row: 3, col: 3}],
        [{row: 0, col: 0}, {row: 1, col: 3}, {row: 2, col: 1}, {row: 3, col: 2}],
        [{row: 0, col: 1}, {row: 1, col: 0}, {row: 2, col: 3}, {row: 3, col: 2}],
        [{row: 0, col: 2}, {row: 1, col: 3}, {row: 2, col: 0}, {row: 3, col: 1}],
        [{row: 0, col: 3}, {row: 1, col: 2}, {row: 2, col: 1}, {row: 3, col: 0}]
      ];

      for (const positionSet of alternativePositions) {
        if (filledCount >= 4) break;

        for (const position of positionSet) {
          if (filledCount >= 4) break;

          if (startingBoard[position.row][position.col] === null) {
            const currentRowCount = rowCounts.get(position.row) || 0;
            const currentColCount = colCounts.get(position.col) || 0;

            if (currentRowCount < 2 && currentColCount < 2) {
              startingBoard[position.row][position.col] = solution[position.row][position.col];
              rowCounts.set(position.row, currentRowCount + 1);
              colCounts.set(position.col, currentColCount + 1);
              filledCount++;
            }
          }
        }
      }
    }

    return startingBoard;
  }

  private isPrime(num: number): boolean {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  }

  private isSquare(num: number): boolean {
    const sqrt = Math.sqrt(num);
    return sqrt === Math.floor(sqrt);
  }

  private isFibonacci(num: number): boolean {
    const fibs = [1, 2, 3, 5, 8, 13];
    return fibs.includes(num);
  }

  private hasConsecutive(numbers: number[]): boolean {
    const sorted = [...numbers].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] - sorted[i] === 1) return true;
    }
    return false;
  }

  private analyzeLine(numbers: number[]): {
    sum: number;
    evens: number;
    odds: number;
    min: number;
    max: number;
    isIncreasing: boolean;
    isDecreasing: boolean;
    uniqueNumbers: Set<number>;
    hasConsecutive: boolean;
    hasFibonacci: boolean;
    hasPrime: boolean;
    hasSquare: boolean;
  } {
    const sum = numbers.reduce((a, b) => a + b, 0);
    const evens = numbers.filter(n => n % 2 === 0).length;
    const odds = numbers.filter(n => n % 2 === 1).length;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const isIncreasing = numbers.every((n, i) => i === 0 || n > numbers[i - 1]);
    const isDecreasing = numbers.every((n, i) => i === 0 || n < numbers[i - 1]);
    const uniqueNumbers = new Set(numbers);
    const hasConsecutive = this.hasConsecutive(numbers);
    const hasFibonacci = numbers.some(n => this.isFibonacci(n));
    const hasPrime = numbers.some(n => this.isPrime(n));
    const hasSquare = numbers.some(n => this.isSquare(n));

    return {
      sum, evens, odds, min, max, isIncreasing, isDecreasing, uniqueNumbers,
      hasConsecutive, hasFibonacci, hasPrime, hasSquare
    };
  }

  private resetConstraintUsage(): void {
    this.constraintTypes.forEach(ct => ct.used = false);
    this.constraintUsageCount.clear();
  }

  private getConstraintUsageCount(constraintType: string): number {
    return this.constraintUsageCount.get(constraintType) || 0;
  }

  private incrementConstraintUsage(constraintType: string): void {
    const currentCount = this.getConstraintUsageCount(constraintType);
    this.constraintUsageCount.set(constraintType, currentCount + 1);
  }

  private getMostRestrictiveConstraint(numbers: number[], isRow: boolean, index: number): Constraint | null {
    const analysis = this.analyzeLine(numbers);

    // Sort constraint types by priority (lower number = higher priority)
    const availableConstraints = [...this.constraintTypes].sort((a, b) => a.priority - b.priority);

    for (const constraintType of availableConstraints) {
      // Skip if this constraint type has already been used 2 times
      if (this.getConstraintUsageCount(constraintType.type) >= 2) continue;

      switch (constraintType.type) {
        case 'order':
          // Order is the most exotic - use it whenever possible
          if (analysis.isIncreasing || analysis.isDecreasing) {
            this.incrementConstraintUsage('order');
            return { order: analysis.isIncreasing ? 'increasing' : 'decreasing' };
          }
          break;

        case 'consecutive':
          // Consecutive is very exotic - use whenever present
          if (analysis.hasConsecutive) {
            this.incrementConstraintUsage('consecutive');
            return { consecutive: true };
          }
          break;

        case 'fibonacci':
          // Fibonacci is very exotic - use whenever present
          if (analysis.hasFibonacci) {
            this.incrementConstraintUsage('fibonacci');
            return { fibonacci: true };
          }
          break;

        case 'square':
          // Square numbers are very exotic - use whenever present
          if (analysis.hasSquare) {
            this.incrementConstraintUsage('square');
            return { square: true };
          }
          break;

        case 'prime':
          // Prime numbers are very exotic - use whenever present
          if (analysis.hasPrime) {
            this.incrementConstraintUsage('prime');
            return { prime: true };
          }
          break;

        case 'contains':
          // Contains is exotic - use for any distinctive number
          const distinctiveNumbers = numbers.filter(n => n <= 4 || n >= 13);
          if (distinctiveNumbers.length > 0) {
            this.incrementConstraintUsage('contains');
            return { contains: distinctiveNumbers[0] };
          }
          break;

        case 'range':
          // Range is exotic - use for any notable min/max
          if (analysis.min <= 8 || analysis.max >= 9) {
            this.incrementConstraintUsage('range');
            return {
              range: analysis.min <= 8 ? { min: analysis.min, max: undefined } : { min: undefined, max: analysis.max }
            };
          }
          break;

        case 'evens':
          // Evens is interesting - use if majority are even
          if (analysis.evens >= 2) {
            this.incrementConstraintUsage('evens');
            return { onlyEven: true };
          }
          break;

        case 'odds':
          // Odds is interesting - use if majority are odd
          if (analysis.odds >= 2) {
            this.incrementConstraintUsage('odds');
            return { onlyOdd: true };
          }
          break;

        case 'sum':
          // Sum is the boring fallback - only use if nothing else works
          // Don't limit sum constraints as they're the fallback
          break;
      }
    }

    // Only fall back to sum if absolutely nothing else works
    this.incrementConstraintUsage('sum');
    return { sum: analysis.sum };
  }

  public generatePuzzle(date: string = new Date().toISOString().split('T')[0]): Puzzle {
    // Update seed for the specific date
    this.seed = this.generateSeedFromDate(date);

    // Reset constraint usage for this puzzle generation
    this.resetConstraintUsage();

    // Generate random solution
    const solution = this.generateRandomGrid();

    // Generate constraints for rows
    const rowConstraints: Constraint[] = [];
    for (let i = 0; i < 4; i++) {
      const rowNumbers = solution[i];
      const constraint = this.getMostRestrictiveConstraint(rowNumbers, true, i);
      rowConstraints.push(constraint || { sum: rowNumbers.reduce((a, b) => a + b, 0) });
    }

    // Generate constraints for columns
    const colConstraints: Constraint[] = [];
    for (let i = 0; i < 4; i++) {
      const colNumbers = solution.map(row => row[i]);
      const constraint = this.getMostRestrictiveConstraint(colNumbers, false, i);
      colConstraints.push(constraint || { sum: colNumbers.reduce((a, b) => a + b, 0) });
    }

    // Ensure exactly 2 sum constraints
    this.ensureTwoSumConstraints(solution, rowConstraints, colConstraints);

    // Generate starting board with pre-filled cells
    const startingBoard = this.generateStartingBoard(solution);

    return {
      solution,
      startingBoard,
      rowConstraints,
      colConstraints,
      date
    };
  }

  private ensureTwoSumConstraints(solution: number[][], rowConstraints: Constraint[], colConstraints: Constraint[]): void {
    // Count current sum constraints
    const sumConstraints = [...rowConstraints, ...colConstraints].filter(c => c.sum !== undefined);

    if (sumConstraints.length === 2) {
      return; // Already have exactly 2 sum constraints
    }

    if (sumConstraints.length > 2) {
      // Too many sum constraints - replace some with other constraints
      this.replaceExcessSumConstraints(solution, rowConstraints, colConstraints);
    } else {
      // Too few sum constraints - force some to be sum constraints
      this.forceSumConstraints(solution, rowConstraints, colConstraints);
    }
  }

  private replaceExcessSumConstraints(solution: number[][], rowConstraints: Constraint[], colConstraints: Constraint[]): void {
    // Reset usage counts to allow more constraint types
    this.resetConstraintUsage();

    // Find lines with sum constraints and try to replace them
    const allConstraints = [...rowConstraints, ...colConstraints];
    const sumIndices: Array<{type: 'row' | 'col', index: number}> = [];

    // Find sum constraint indices
    rowConstraints.forEach((constraint, index) => {
      if (constraint.sum !== undefined) {
        sumIndices.push({type: 'row', index});
      }
    });

    colConstraints.forEach((constraint, index) => {
      if (constraint.sum !== undefined) {
        sumIndices.push({type: 'col', index});
      }
    });

    // Try to replace excess sum constraints (keep only 2)
    const excessCount = sumIndices.length - 2;
    for (let i = 0; i < excessCount; i++) {
      const {type, index} = sumIndices[i];
      const numbers = type === 'row' ? solution[index] : solution.map(row => row[index]);

      // Try to find a different constraint for this line
      const newConstraint = this.getMostRestrictiveConstraint(numbers, type === 'row', index);
      if (newConstraint && newConstraint.sum === undefined) {
        if (type === 'row') {
          rowConstraints[index] = newConstraint;
        } else {
          colConstraints[index] = newConstraint;
        }
      }
    }
  }

  private forceSumConstraints(solution: number[][], rowConstraints: Constraint[], colConstraints: Constraint[]): void {
    // Reset usage counts
    this.resetConstraintUsage();

    // Count current sum constraints
    const sumConstraints = [...rowConstraints, ...colConstraints].filter(c => c.sum !== undefined);
    const neededSumConstraints = 2 - sumConstraints.length;

    if (neededSumConstraints <= 0) return;

    // Find lines without sum constraints
    const nonSumIndices: Array<{type: 'row' | 'col', index: number}> = [];

    rowConstraints.forEach((constraint, index) => {
      if (constraint.sum === undefined) {
        nonSumIndices.push({type: 'row', index});
      }
    });

    colConstraints.forEach((constraint, index) => {
      if (constraint.sum === undefined) {
        nonSumIndices.push({type: 'col', index});
      }
    });

    // Shuffle to randomize which lines get sum constraints
    const shuffledIndices = this.shuffleArray(nonSumIndices);

    // Force sum constraints on the needed number of lines
    for (let i = 0; i < Math.min(neededSumConstraints, shuffledIndices.length); i++) {
      const {type, index} = shuffledIndices[i];
      const numbers = type === 'row' ? solution[index] : solution.map(row => row[index]);

      if (type === 'row') {
        rowConstraints[index] = { sum: numbers.reduce((a, b) => a + b, 0) };
      } else {
        colConstraints[index] = { sum: numbers.reduce((a, b) => a + b, 0) };
      }
    }
  }

  public getTodaysPuzzle(): Puzzle {
    // Get today's date in UTC format (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    return this.generatePuzzle(today);
  }
}

// Export a singleton instance
export const puzzleGenerator = new PuzzleGenerator();
