/**
 * © 2024 Henry Burgess. All rights reserved.
 *
 * Puzzle Types - TypeScript definitions for the game
 */

export interface Constraint {
  sum?: number;
  even?: boolean;
  contains?: number[];
  range?: {
    min: number;
    max: number;
  };
}

export interface Puzzle {
  solution: number[][];
  startingBoard: (number | null)[][];
  rowConstraints: Constraint[];
  colConstraints: Constraint[];
  date: string;
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
