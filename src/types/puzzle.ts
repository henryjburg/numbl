export interface Constraint {
  sum?: number;
  onlyOdd?: boolean;
  onlyEven?: boolean;
  unique?: boolean;
  // Add more as needed
}

export interface Puzzle {
  solution: number[][]; // 4x4
  rowConstraints: Constraint[];
  colConstraints: Constraint[];
}

export type FeedbackType = "none" | "correct" | "misplaced" | "wrong" | "exists-elsewhere";

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
  timeInSeconds: number;
}
