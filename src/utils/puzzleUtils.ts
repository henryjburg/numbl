import { Constraint, Puzzle, FeedbackType } from '../types/puzzle';

export const getConstraintName = (constraint: Constraint): string => {
  if (constraint.sum) return 'Sum';
  if (constraint.even === true) return 'Even';
  if (constraint.even === false) return 'Odd';
  if (constraint.contains) return 'Contains';
  if (constraint.range) return 'Range';
  return '';
};

export const getConstraintValue = (constraint: Constraint): string => {
  if (constraint.sum) return constraint.sum.toString();
  if (constraint.even === true) return 'All Even';
  if (constraint.even === false) return 'All Odd';
  if (constraint.contains)
    return constraint.contains.sort((a, b) => a - b).join(', ');
  if (constraint.range)
    return `${constraint.range.min}-${constraint.range.max}`;
  return '';
};

export const getConstraintType = (
  constraint: Constraint
): 'sum' | 'even' | 'odd' | 'contains' | 'range' => {
  if (constraint.sum) return 'sum';
  if (constraint.even === true) return 'even';
  if (constraint.even === false) return 'odd';
  if (constraint.contains) return 'contains';
  if (constraint.range) return 'range';
  return 'sum';
};

export const isConstraintSatisfied = (
  puzzle: Puzzle,
  board: string[][],
  constraint: Constraint,
  lineType: 'row' | 'col',
  index: number
): boolean => {
  const line = lineType === 'row' ? board[index] : board.map(row => row[index]);
  const numbers = line.map(cell => Number(cell)).filter(num => !isNaN(num));

  if (numbers.length !== 4) return false;

  if (constraint.sum) {
    return numbers.reduce((sum, num) => sum + num, 0) === constraint.sum;
  }

  if (constraint.even === true) {
    return numbers.every(num => num % 2 === 0);
  }
  if (constraint.even === false) {
    return numbers.every(num => num % 2 === 1);
  }

  if (constraint.contains) {
    return constraint.contains.every(requiredNum =>
      numbers.includes(requiredNum)
    );
  }

  if (constraint.range) {
    return numbers.every(
      num => num >= constraint.range!.min && num <= constraint.range!.max
    );
  }

  return false;
};

export const isConstraintGuessedCorrect = (
  feedback: FeedbackType[][],
  lineType: 'row' | 'col',
  index: number
): boolean => {
  const line =
    lineType === 'row' ? feedback[index] : feedback.map(row => row[index]);
  return line.every(cell => cell === 'correct');
};

export const isPuzzleComplete = (feedback: FeedbackType[][]): boolean => {
  return feedback.every(row => row.every(cell => cell === 'correct'));
};

export const getDuplicates = (board: string[][]): Set<string> => {
  const duplicates = new Set<string>();

  for (let row = 0; row < 4; row++) {
    const rowNumbers = new Map<string, number>();
    for (let col = 0; col < 4; col++) {
      const cell = board[row][col];
      if (cell !== '') {
        const count = rowNumbers.get(cell) || 0;
        rowNumbers.set(cell, count + 1);
      }
    }

    rowNumbers.forEach((count, num) => {
      if (count > 1) {
        for (let col = 0; col < 4; col++) {
          if (board[row][col] === num) {
            duplicates.add(`${row},${col}`);
          }
        }
      }
    });
  }

  for (let col = 0; col < 4; col++) {
    const colNumbers = new Map<string, number>();
    for (let row = 0; row < 4; row++) {
      const cell = board[row][col];
      if (cell !== '') {
        const count = colNumbers.get(cell) || 0;
        colNumbers.set(cell, count + 1);
      }
    }

    colNumbers.forEach((count, num) => {
      if (count > 1) {
        for (let row = 0; row < 4; row++) {
          if (board[row][col] === num) {
            duplicates.add(`${row},${col}`);
          }
        }
      }
    });
  }

  return duplicates;
};

export const hasDuplicatesInLine = (
  board: string[][],
  lineType: 'row' | 'col',
  index: number
): boolean => {
  const numbers = new Map<string, number>();

  if (lineType === 'row') {
    for (let col = 0; col < 4; col++) {
      const cell = board[index][col];
      if (cell !== '') {
        const count = numbers.get(cell) || 0;
        numbers.set(cell, count + 1);
      }
    }
  } else {
    for (let row = 0; row < 4; row++) {
      const cell = board[row][index];
      if (cell !== '') {
        const count = numbers.get(cell) || 0;
        numbers.set(cell, count + 1);
      }
    }
  }

  for (let i = 0; i < numbers.size; i++) {
    const count = Array.from(numbers.values())[i];
    if (count > 1) {
      return true;
    }
  }

  return false;
};

export const generatePuzzleHash = (puzzle: Puzzle): string => {
  const solutionStr = puzzle.solution.flat().join('');
  const rowConstraintsStr = puzzle.rowConstraints
    .map(c => {
      if (c.sum) return `s${c.sum}`;
      if (c.even) return 'e';
      if (c.contains) return `c${c.contains.join('')}`;
      if (c.range) return `r${c.range.min}${c.range.max}`;
      return '';
    })
    .join('');
  const colConstraintsStr = puzzle.colConstraints
    .map(c => {
      if (c.sum) return `s${c.sum}`;
      if (c.even) return 'e';
      if (c.contains) return `c${c.contains.join('')}`;
      if (c.range) return `r${c.range.min}${c.range.max}`;
      return '';
    })
    .join('');

  const puzzleStr = `${solutionStr}|${rowConstraintsStr}|${colConstraintsStr}`;

  let hash = 0;
  for (let i = 0; i < puzzleStr.length; i++) {
    const char = puzzleStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(36).toUpperCase();
};

export const emptyBoard = () =>
  Array(4)
    .fill(null)
    .map(() => Array(4).fill(''));

export const startingBoardToBoard = (
  startingBoard: (number | null)[][]
): string[][] => {
  return startingBoard.map(row =>
    row.map(cell =>
      cell !== null && cell !== undefined ? cell.toString() : ''
    )
  );
};
