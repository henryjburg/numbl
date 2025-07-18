import { Constraint, Puzzle, FeedbackType } from '../types/puzzle';

export const getConstraintName = (constraint: Constraint): string => {
  if (constraint.sum) return 'Sum';
  if (constraint.onlyOdd) return 'Odds';
  if (constraint.onlyEven) return 'Evens';
  if (constraint.range) return 'Range';
  if (constraint.contains) return 'Contains';
  if (constraint.order) return 'Order';
  if (constraint.consecutive) return 'Consecutive';
  if (constraint.fibonacci) return 'Fibonacci';
  if (constraint.prime) return 'Prime';
  if (constraint.square) return 'Square';
  if (constraint.unique) return 'Unique';
  return '';
};

export const getConstraintValue = (constraint: Constraint): string => {
  if (constraint.sum) return constraint.sum.toString();
  if (constraint.onlyOdd) return 'Odd';
  if (constraint.onlyEven) return 'Even';
  if (constraint.range) {
    if (constraint.range.min !== undefined && constraint.range.max !== undefined) {
      return `${constraint.range.min}-${constraint.range.max}`;
    } else if (constraint.range.min !== undefined) {
      return `≥${constraint.range.min}`;
    } else if (constraint.range.max !== undefined) {
      return `≤${constraint.range.max}`;
    }
  }
  if (constraint.contains) return constraint.contains.toString();
  if (constraint.order) return constraint.order === 'increasing' ? 'Low → High' : 'High → Low';
  if (constraint.consecutive) return '';
  if (constraint.fibonacci) return '';
  if (constraint.prime) return '';
  if (constraint.square) return '';
  if (constraint.unique) return '';
  return '';
};

export const getConstraintType = (constraint: Constraint): 'sum' | 'odd' | 'even' | 'range' | 'contains' | 'order' | 'consecutive' | 'fibonacci' | 'prime' | 'square' | 'unique' => {
  if (constraint.sum) return 'sum';
  if (constraint.onlyOdd) return 'odd';
  if (constraint.onlyEven) return 'even';
  if (constraint.range) return 'range';
  if (constraint.contains) return 'contains';
  if (constraint.order) return 'order';
  if (constraint.consecutive) return 'consecutive';
  if (constraint.fibonacci) return 'fibonacci';
  if (constraint.prime) return 'prime';
  if (constraint.square) return 'square';
  if (constraint.unique) return 'unique';
  return 'sum'; // fallback
};

// Check if a constraint is satisfied
export const isConstraintSatisfied = (puzzle: Puzzle, board: string[][], constraint: Constraint, lineType: 'row' | 'col', index: number): boolean => {
  const line = lineType === 'row' ? board[index] : board.map(row => row[index]);
  const numbers = line.map(cell => Number(cell)).filter(num => !isNaN(num));

  if (numbers.length !== 4) return false;

  if (constraint.sum) {
    return numbers.reduce((sum, num) => sum + num, 0) === constraint.sum;
  }

  if (constraint.onlyOdd) {
    return numbers.every(num => num % 2 === 1);
  }

  if (constraint.onlyEven) {
    return numbers.every(num => num % 2 === 0);
  }

  if (constraint.range) {
    const range = constraint.range;
    if (range.min !== undefined && numbers.some(num => num < (range.min as number))) {
      return false;
    }
    if (range.max !== undefined && numbers.some(num => num > (range.max as number))) {
      return false;
    }
    return true;
  }

  if (constraint.contains) {
    return numbers.includes(constraint.contains);
  }

  if (constraint.order) {
    if (constraint.order === 'increasing') {
      return numbers.every((num, i) => i === 0 || num > numbers[i - 1]);
    } else {
      return numbers.every((num, i) => i === 0 || num < numbers[i - 1]);
    }
  }

  if (constraint.consecutive) {
    const sorted = [...numbers].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] - sorted[i] === 1) return true;
    }
    return false;
  }

  if (constraint.fibonacci) {
    const fibs = [1, 2, 3, 5, 8, 13];
    return numbers.some(n => fibs.includes(n));
  }

  if (constraint.prime) {
    const isPrime = (num: number) => {
      if (num < 2) return false;
      for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
      }
      return true;
    };
    return numbers.some(n => isPrime(n));
  }

  if (constraint.square) {
    return numbers.some(n => {
      const sqrt = Math.sqrt(n);
      return sqrt === Math.floor(sqrt);
    });
  }

  if (constraint.unique) {
    return new Set(numbers).size === 4;
  }

  return false;
};

// Check if a constraint has been formally guessed and confirmed correct
export const isConstraintGuessedCorrect = (feedback: FeedbackType[][], lineType: 'row' | 'col', index: number): boolean => {
  const line = lineType === 'row'
    ? feedback[index]
    : feedback.map(row => row[index]);
  return line.every(cell => cell === 'correct');
};

// Check if puzzle is complete (all cells are correct)
export const isPuzzleComplete = (feedback: FeedbackType[][]): boolean => {
  return feedback.every(row => row.every(cell => cell === 'correct'));
};

// Check for duplicates in the entire grid (enforcing uniqueness constraint)
export const getDuplicates = (board: string[][]): Set<string> => {
  const duplicates = new Set<string>();
  const allNumbers = new Map<string, number>();

  // Collect all numbers and their positions
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const cell = board[row][col];
      if (cell !== '') {
        const count = allNumbers.get(cell) || 0;
        allNumbers.set(cell, count + 1);
      }
    }
  }

  // Mark duplicates across the entire grid
  allNumbers.forEach((count, num) => {
    if (count > 1) {
      // Mark all instances of this number as duplicates
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (board[row][col] === num) {
            duplicates.add(`${row},${col}`);
          }
        }
      }
    }
  });

  return duplicates;
};

// Check if the entire grid has duplicates (enforcing uniqueness constraint)
export const hasDuplicatesInLine = (board: string[][], lineType: 'row' | 'col', index: number): boolean => {
  const allNumbers = new Map<string, number>();

  // Collect all numbers in the grid
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const cell = board[row][col];
      if (cell !== '') {
        const count = allNumbers.get(cell) || 0;
        allNumbers.set(cell, count + 1);
      }
    }
  }

  // Check if any number appears more than once
  for (let i = 0; i < allNumbers.size; i++) {
    const count = Array.from(allNumbers.values())[i];
    if (count > 1) {
      return true;
    }
  }

  return false;
};

// Generate unique hash for puzzle
export const generatePuzzleHash = (puzzle: Puzzle): string => {
  // Create a string representation of the puzzle
  const solutionStr = puzzle.solution.flat().join('');
  const rowConstraintsStr = puzzle.rowConstraints.map(c => {
    if (c.sum) return `s${c.sum}`;
    if (c.onlyOdd) return 'o';
    if (c.onlyEven) return 'e';
    if (c.unique) return 'u';
    return '';
  }).join('');
  const colConstraintsStr = puzzle.colConstraints.map(c => {
    if (c.sum) return `s${c.sum}`;
    if (c.onlyOdd) return 'o';
    if (c.onlyEven) return 'e';
    if (c.unique) return 'u';
    return '';
  }).join('');

  const puzzleStr = `${solutionStr}|${rowConstraintsStr}|${colConstraintsStr}`;

  // Simple hash function (you could use a more sophisticated one)
  let hash = 0;
  for (let i = 0; i < puzzleStr.length; i++) {
    const char = puzzleStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36).toUpperCase();
};

export const emptyBoard = () => Array(4).fill(null).map(() => Array(4).fill(''));

export const startingBoardToBoard = (startingBoard: (number | null)[][]): string[][] => {
  return startingBoard.map(row =>
    row.map(cell => cell !== null ? cell.toString() : '')
  );
};
