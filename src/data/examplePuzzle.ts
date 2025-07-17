import { Puzzle } from '../types/puzzle';

// Example puzzle (solution and constraints)
export const examplePuzzle: Puzzle = {
  solution: [
    [7, 5, 6, 2],
    [1, 9, 4, 6],
    [3, 8, 2, 7],
    [9, 1, 5, 4],
  ],
  rowConstraints: [
    { sum: 20 },
    { sum: 20 },
    { sum: 20 },
    { sum: 19 },
  ],
  colConstraints: [
    { onlyOdd: true },
    { sum: 23 },
    { unique: true },
    { sum: 19 },
  ],
};
