import { Puzzle, Constraint } from '../types/puzzle';

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

    let seed = 0;
    for (let i = 0; i < date.length; i++) {
      seed = (seed << 5) - seed + date.charCodeAt(i);
      seed = seed & seed;
    }
    return seed + daysDiff;
  }

  private seededRandom(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  private shuffleArray<T>(array: T[]): T[] {
    if (!array || array.length === 0) return [];

    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.seededRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateRandomGrid(): number[][] {
    const numbers = Array.from({ length: 9 }, (_, i) => i + 1);
    const shuffledNumbers = this.shuffleArray(numbers);

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
    const startingBoard: (number | null)[][] = solution.map(row =>
      row.map(() => null)
    );

    const positions: Array<{ row: number; col: number; priority: number }> = [];

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        let priority = 0;

        const rowConstraint = rowConstraints[row];
        const colConstraint = colConstraints[col];

        if (rowConstraint.contains || colConstraint.contains) continue;

        if (rowConstraint.range || colConstraint.range) priority += 2;
        if (
          rowConstraint.even !== undefined ||
          colConstraint.even !== undefined
        )
          priority += 1;

        if ((row === 0 || row === 3) && (col === 0 || col === 3)) priority += 2;

        positions.push({ row, col, priority });
      }
    }

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

    const availableConstraints: Array<{
      constraint: Constraint;
      type: string;
    }> = [{ constraint: { sum }, type: 'sum' }];

    if (evens === 4) {
      availableConstraints.push({ constraint: { even: true }, type: 'even' });
    } else if (evens === 0) {
      availableConstraints.push({ constraint: { even: false }, type: 'odd' });
    }

    if (uniqueNumbers.length >= 2) {
      const shuffled = this.shuffleArray(uniqueNumbers);
      availableConstraints.push({
        constraint: { contains: [shuffled[0], shuffled[1]] },
        type: 'contains',
      });
    }

    const rangeSize = maxNum - minNum + 1;
    if (rangeSize <= 5) {
      availableConstraints.push({
        constraint: { range: { min: minNum, max: maxNum } },
        type: 'range',
      });
    }

    if (availableConstraints.length === 0) {
      return { constraint: { sum }, type: 'sum' };
    }

    const unusedConstraints = availableConstraints.filter(
      c => !usedConstraints.has(c.type)
    );

    if (unusedConstraints.length > 0) {
      const randomIndex = Math.floor(
        this.seededRandom() * unusedConstraints.length
      );
      if (randomIndex >= 0 && randomIndex < unusedConstraints.length) {
        return unusedConstraints[randomIndex];
      }
    }

    const randomIndex = Math.floor(
      this.seededRandom() * availableConstraints.length
    );
    if (randomIndex >= 0 && randomIndex < availableConstraints.length) {
      return availableConstraints[randomIndex];
    }

    return availableConstraints[0];
  }

  public generatePuzzle(
    date: string = new Date().toISOString().split('T')[0]
  ): Puzzle {
    this.seed = this.generateSeedFromDate(date);

    const solution = this.generateRandomGrid();
    const usedConstraintTypes = new Set<string>();

    const rowNumbers = solution.map(row => [...row]);
    const colNumbers = solution[0].map((_, col) =>
      solution.map(row => row[col])
    );

    const rowConstraints: Constraint[] = [];
    const colConstraints: Constraint[] = [];

    for (let i = 0; i < 4; i++) {
      const rowConstraint = this.generateConstraint(
        rowNumbers[i],
        false,
        usedConstraintTypes
      );
      rowConstraints.push(rowConstraint.constraint);
      usedConstraintTypes.add(rowConstraint.type);

      const colConstraint = this.generateConstraint(
        colNumbers[i],
        false,
        usedConstraintTypes
      );
      colConstraints.push(colConstraint.constraint);
      usedConstraintTypes.add(colConstraint.type);
    }

    const startingBoard = this.generateStrategicStartingBoard(
      solution,
      rowConstraints,
      colConstraints
    );

    return {
      solution,
      rowConstraints,
      colConstraints,
      startingBoard,
      date,
    };
  }

  public getTodaysPuzzle(): Puzzle {
    return this.generatePuzzle();
  }
}
