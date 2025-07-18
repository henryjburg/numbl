/**
 * © 2025 Henry Burgess. All rights reserved.
 *
 * Puzzle Utilities - Core game logic and constraint validation
 */

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

const getLineDuplicates = (line: string[]): Set<string> => {
  const duplicates = new Set<string>();
  const counts = new Map<string, number>();

  line.forEach((cell, index) => {
    if (cell !== '') {
      const count = (counts.get(cell) || 0) + 1;
      counts.set(cell, count);
      if (count > 1) {
        line.forEach((c, i) => {
          if (c === cell) duplicates.add(`${index},${i}`);
        });
      }
    }
  });

  return duplicates;
};

export const getDuplicates = (board: string[][]): Set<string> => {
  const duplicates = new Set<string>();

  for (let row = 0; row < 4; row++) {
    const rowDuplicates = getLineDuplicates(board[row]);
    rowDuplicates.forEach(pos => {
      const [, c] = pos.split(',').map(Number);
      duplicates.add(`${row},${c}`);
    });
  }

  for (let col = 0; col < 4; col++) {
    const colLine = board.map(row => row[col]);
    const colDuplicates = getLineDuplicates(colLine);
    colDuplicates.forEach(pos => {
      const [, c] = pos.split(',').map(Number);
      duplicates.add(`${c},${col}`);
    });
  }

  return duplicates;
};

export const hasDuplicatesInLine = (
  board: string[][],
  lineType: 'row' | 'col',
  index: number
): boolean => {
  const line = lineType === 'row' ? board[index] : board.map(row => row[index]);
  const numbers = new Map<string, number>();

  line.forEach(cell => {
    if (cell !== '') {
      numbers.set(cell, (numbers.get(cell) || 0) + 1);
    }
  });

  return Array.from(numbers.values()).some(count => count > 1);
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
