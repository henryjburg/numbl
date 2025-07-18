import {
  Puzzle,
  FeedbackType,
  ScoreBreakdown,
  GameStats,
} from '../types/puzzle';

// Scoring constants
const SCORING = {
  FIRST_TIME_CORRECT_BONUS: 100,
  PERFECT_ACCURACY_BONUS: 300,
  EFFICIENCY_BONUS: 200,
  EFFICIENCY_THRESHOLD: 8,
  CORRECTNESS_MULTIPLIER_PER_FIRST_GUESS: 0.1,
};

export const calculateTimeBonuses = (
  timeInSeconds: number
): { bonus: number; multiplier: number } => {
  // Maximum time bonus of 500 points for completing under 1 minute
  const MAX_TIME_BONUS = 500;
  const BONUS_DECREASE_PER_30_SECONDS = 100;
  const ONE_MINUTE = 60;

  if (timeInSeconds <= ONE_MINUTE) {
    return { bonus: MAX_TIME_BONUS, multiplier: 1.0 };
  }

  // Calculate how many 30-second intervals beyond 1 minute
  const secondsBeyondOneMinute = timeInSeconds - ONE_MINUTE;
  const thirtySecondIntervals = Math.ceil(secondsBeyondOneMinute / 30);

  // Calculate time bonus: max bonus minus decrease for each 30-second interval
  const timeBonus = Math.max(
    0,
    MAX_TIME_BONUS - thirtySecondIntervals * BONUS_DECREASE_PER_30_SECONDS
  );

  return { bonus: timeBonus, multiplier: 1.0 };
};

export const calculateCorrectnessMultiplier = (
  firstTimeCorrectCells: number
): number => {
  return (
    1.0 + firstTimeCorrectCells * SCORING.CORRECTNESS_MULTIPLIER_PER_FIRST_GUESS
  );
};

export const calculateRunningScore = (
  puzzle: Puzzle,
  feedback: FeedbackType[][],
  gameStats: GameStats
): number => {
  const {
    correctGuesses,
    wrongGuesses,
    firstTimeCorrectRows,
    firstTimeCorrectCols,
  } = gameStats;

  // Only count points from actual guesses
  const correctGuessPoints = correctGuesses * 50; // 50 points per correct guess
  const firstTimeCorrectBonus =
    (firstTimeCorrectRows + firstTimeCorrectCols) *
    SCORING.FIRST_TIME_CORRECT_BONUS;

  const totalScore = correctGuessPoints + firstTimeCorrectBonus;

  // No time bonuses, no efficiency bonuses, no perfect accuracy bonuses during gameplay
  return totalScore;
};

export const calculateScore = (
  puzzle: Puzzle,
  feedback: FeedbackType[][],
  gameStats: GameStats
): ScoreBreakdown => {
  const {
    timeInSeconds,
    totalGuesses,
    wrongGuesses,
    firstTimeCorrectRows,
    firstTimeCorrectCols,
    firstTimeCorrectCells,
  } = gameStats;

  const isCompleted = feedback.every(row =>
    row.every(cell => cell === 'correct')
  );
  const baseScore = 0; // No base score

  const { bonus: timeBonus, multiplier: timeMultiplier } =
    calculateTimeBonuses(timeInSeconds);
  const firstTimeCorrectBonus =
    (firstTimeCorrectRows + firstTimeCorrectCols) *
    SCORING.FIRST_TIME_CORRECT_BONUS;

  // Only give these bonuses if puzzle is completed
  const perfectAccuracyBonus =
    isCompleted && wrongGuesses === 0 ? SCORING.PERFECT_ACCURACY_BONUS : 0;
  const efficiencyBonus =
    isCompleted && totalGuesses < SCORING.EFFICIENCY_THRESHOLD
      ? SCORING.EFFICIENCY_BONUS
      : 0;

  // Calculate correctness multiplier based on first-time correct guesses
  const correctnessMultiplier = calculateCorrectnessMultiplier(
    firstTimeCorrectCells
  );

  const subtotal =
    timeBonus + firstTimeCorrectBonus + perfectAccuracyBonus + efficiencyBonus;
  const totalScore = Math.round(
    subtotal * timeMultiplier * correctnessMultiplier
  );

  return {
    baseScore,
    timeBonus,
    timeMultiplier,
    firstTimeCorrectBonus,
    perfectAccuracyBonus,
    efficiencyBonus,
    difficultyMultiplier: correctnessMultiplier, // Keep the same property name for compatibility
    totalScore,
  };
};

export const formatScore = (score: number): string => score.toLocaleString();
