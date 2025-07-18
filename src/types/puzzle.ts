export interface Constraint {
  sum?: number;
  onlyOdd?: boolean;
  onlyEven?: boolean;
  range?: {
    min: number | undefined;
    max: number | undefined;
  };
  contains?: number;
  order?: 'increasing' | 'decreasing';
  unique?: boolean;
  // New exotic constraints
  consecutive?: boolean;  // Contains consecutive numbers (e.g., 3,4,5)
  fibonacci?: boolean;    // Contains Fibonacci numbers
  prime?: boolean;        // Contains prime numbers
  square?: boolean;       // Contains square numbers (1,4,9,16)
}

export interface Puzzle {
  solution: number[][]; // 4x4
  startingBoard: (number | null)[][]; // 4x4 with some pre-filled cells
  rowConstraints: Constraint[];
  colConstraints: Constraint[];
  date: string; // ISO date string for the puzzle
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

export interface ConstraintType {
  type: 'sum' | 'evens' | 'odds' | 'range' | 'contains' | 'order' | 'consecutive' | 'fibonacci' | 'prime' | 'square';
  priority: number;
  used: boolean;
}
