import { Constraint, Puzzle, FeedbackType } from '../types/puzzle';

export const getConstraintText = (constraint: Constraint) => {
  if (constraint.sum) return `${constraint.sum}`;
  if (constraint.onlyOdd) return 'Odd';
  if (constraint.onlyEven) return 'Even';
  if (constraint.unique) return 'Unique';
  return '';
};

export const getConstraintType = (constraint: Constraint): 'sum' | 'odd' | 'even' | 'unique' => {
  if (constraint.sum) return 'sum';
  if (constraint.onlyOdd) return 'odd';
  if (constraint.onlyEven) return 'even';
  if (constraint.unique) return 'unique';
  return 'sum'; // fallback
};

// Check if a constraint is satisfied
export const isConstraintSatisfied = (puzzle: Puzzle, board: string[][], constraint: Constraint, lineType: 'row' | 'col', index: number): boolean => {
  if (constraint.sum) {
    const line = lineType === 'row' ? board[index] : board.map(row => row[index]);
    const numbers = line.map(cell => Number(cell)).filter(num => !isNaN(num));
    return numbers.length === 4 && numbers.reduce((sum, num) => sum + num, 0) === constraint.sum;
  }

  if (constraint.onlyOdd || constraint.onlyEven) {
    const line = lineType === 'row' ? board[index] : board.map(row => row[index]);
    const numbers = line.map(cell => Number(cell)).filter(num => !isNaN(num));
    if (numbers.length !== 4) return false;

    if (constraint.onlyOdd) {
      return numbers.every(num => num % 2 === 1);
    } else {
      return numbers.every(num => num % 2 === 0);
    }
  }

  if (constraint.unique) {
    const line = lineType === 'row' ? board[index] : board.map(row => row[index]);
    const numbers = line.filter(cell => cell !== '');
    return numbers.length === 4 && new Set(numbers).size === 4;
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
