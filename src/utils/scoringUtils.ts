import { Puzzle, FeedbackType, ScoreBreakdown, GameStats } from '../types/puzzle';

// Scoring constants
const SCORING = {
  TIME_BONUSES: {
    UNDER_2_MIN: 500,
    UNDER_5_MIN: 200,
    UNDER_10_MIN: 50,
  },
  TIME_MULTIPLIERS: {
    UNDER_2_MIN: 2.0,
    UNDER_5_MIN: 1.5,
    UNDER_10_MIN: 1.2,
  },
  FIRST_TIME_CORRECT_BONUS: 100,
  PERFECT_ACCURACY_BONUS: 300,
  EFFICIENCY_BONUS: 200,
  EFFICIENCY_THRESHOLD: 8,
  DIFFICULTY_MULTIPLIERS: {
    COMPLEX_CONSTRAINT: 1.2,
    MULTIPLE_CONSTRAINTS: 1.1,
  }
};

export const calculateTimeBonuses = (timeInSeconds: number): { bonus: number; multiplier: number } => {
  if (timeInSeconds < 120) return { bonus: SCORING.TIME_BONUSES.UNDER_2_MIN, multiplier: SCORING.TIME_MULTIPLIERS.UNDER_2_MIN };
  if (timeInSeconds < 300) return { bonus: SCORING.TIME_BONUSES.UNDER_5_MIN, multiplier: SCORING.TIME_MULTIPLIERS.UNDER_5_MIN };
  if (timeInSeconds < 600) return { bonus: SCORING.TIME_BONUSES.UNDER_10_MIN, multiplier: SCORING.TIME_MULTIPLIERS.UNDER_10_MIN };
  return { bonus: 0, multiplier: 1.0 };
};

export const calculateDifficultyMultiplier = (puzzle: Puzzle): number => {
  let multiplier = 1.0;
  const allConstraints = [...puzzle.rowConstraints, ...puzzle.colConstraints];
  const hasComplexConstraints = allConstraints.some(c => c.onlyOdd || c.onlyEven || c.unique);
  if (hasComplexConstraints) multiplier *= SCORING.DIFFICULTY_MULTIPLIERS.COMPLEX_CONSTRAINT;
  return multiplier;
};

export const calculateRunningScore = (
  puzzle: Puzzle,
  feedback: FeedbackType[][],
  gameStats: GameStats
): number => {
  const { correctGuesses, wrongGuesses, firstTimeCorrectRows, firstTimeCorrectCols } = gameStats;

  // Only count points from actual guesses
  const correctGuessPoints = correctGuesses * 50; // 50 points per correct guess
  const firstTimeCorrectBonus = (firstTimeCorrectRows + firstTimeCorrectCols) * SCORING.FIRST_TIME_CORRECT_BONUS;

  const totalScore = correctGuessPoints + firstTimeCorrectBonus;

  console.log('Running score calculation:', {
    correctGuesses,
    wrongGuesses,
    firstTimeCorrectRows,
    firstTimeCorrectCols,
    correctGuessPoints,
    firstTimeCorrectBonus,
    totalScore
  });

  // No time bonuses, no efficiency bonuses, no perfect accuracy bonuses during gameplay
  return totalScore;
};

export const calculateScore = (
  puzzle: Puzzle,
  feedback: FeedbackType[][],
  gameStats: GameStats
): ScoreBreakdown => {
  const { timeInSeconds, totalGuesses, wrongGuesses, firstTimeCorrectRows, firstTimeCorrectCols } = gameStats;

  const isCompleted = feedback.every(row => row.every(cell => cell === 'correct'));
  const baseScore = 0; // No base score

  const { bonus: timeBonus, multiplier: timeMultiplier } = calculateTimeBonuses(timeInSeconds);
  const firstTimeCorrectBonus = (firstTimeCorrectRows + firstTimeCorrectCols) * SCORING.FIRST_TIME_CORRECT_BONUS;

  // Only give these bonuses if puzzle is completed
  const perfectAccuracyBonus = isCompleted && wrongGuesses === 0 ? SCORING.PERFECT_ACCURACY_BONUS : 0;
  const efficiencyBonus = isCompleted && totalGuesses < SCORING.EFFICIENCY_THRESHOLD ? SCORING.EFFICIENCY_BONUS : 0;

  // Only apply difficulty multiplier if there's actual gameplay or puzzle is completed
  const hasGameplay = totalGuesses > 0 || isCompleted;
  const difficultyMultiplier = hasGameplay ? calculateDifficultyMultiplier(puzzle) : 1.0;

  const subtotal = timeBonus + firstTimeCorrectBonus + perfectAccuracyBonus + efficiencyBonus;
  const totalScore = Math.round(subtotal * timeMultiplier * difficultyMultiplier);

  return {
    baseScore,
    timeBonus,
    timeMultiplier,
    firstTimeCorrectBonus,
    perfectAccuracyBonus,
    efficiencyBonus,
    difficultyMultiplier,
    totalScore
  };
};

export const formatScore = (score: number): string => score.toLocaleString();
