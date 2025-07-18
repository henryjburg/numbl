export interface Constraint {
  sum?: number;
  even?: boolean;
  contains?: number[]; // Array of 2 digits that must be present
  range?: {
    min: number;
    max: number;
  };
}

export interface Puzzle {
  solution: number[][]; // 4x4 with digits 1-9
  startingBoard: (number | null)[][]; // 4x4 with some pre-filled cells (4-5)
  rowConstraints: Constraint[];
  colConstraints: Constraint[];
  date: string; // ISO date string for the puzzle
}

export type FeedbackType = 'none' | 'correct' | 'misplaced' | 'wrong';

export interface ScoreBreakdown {
  baseScore: number;
  timeBonus: number;
  timeMultiplier: number;
  firstTimeCorrectBonus: number;
  perfectAccuracyBonus: number;
  efficiencyBonus: number;
  difficultyMultiplier: number;
  totalScore: number;
}

export interface GameStats {
  totalGuesses: number;
  correctGuesses: number;
  wrongGuesses: number;
  firstTimeCorrectRows: number;
  firstTimeCorrectCols: number;
  firstTimeCorrectCells: number;
  timeInSeconds: number;
}

export interface ConstraintType {
  type: 'sum' | 'even' | 'contains' | 'range';
  priority: number;
  used: boolean;
}
