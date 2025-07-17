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

export type FeedbackType = "none" | "correct" | "misplaced" | "wrong";
