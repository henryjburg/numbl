import { Puzzle } from '../types/puzzle';

// Example puzzle (solution and constraints) - using numbers 1-16 with uniqueness
export const examplePuzzle: Puzzle = {
  solution: [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
  ],
  rowConstraints: [
    { sum: 10 },
    { sum: 26 },
    { sum: 42 },
    { sum: 58 },
  ],
  colConstraints: [
    { sum: 28 },
    { sum: 32 },
    { sum: 36 },
    { sum: 40 },
  ],
};
