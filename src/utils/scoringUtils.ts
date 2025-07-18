/**
 * © 2025 Henry Burgess. All rights reserved.
 *
 * Scoring Utilities - Game scoring and bonus calculations
 */

import {
  Puzzle,
  FeedbackType,
  ScoreBreakdown,
  GameStats,
} from '../types/puzzle';

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
  const MAX_TIME_BONUS = 500;
  const BONUS_DECREASE_PER_30_SECONDS = 100;
  const ONE_MINUTE = 60;

  if (timeInSeconds <= ONE_MINUTE) {
    return { bonus: MAX_TIME_BONUS, multiplier: 1.0 };
  }

  const secondsBeyondOneMinute = timeInSeconds - ONE_MINUTE;
  const thirtySecondIntervals = Math.ceil(secondsBeyondOneMinute / 30);

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

export const calculateDifficultyMultiplier = (
  puzzle: Puzzle,
  firstTimeCorrectCells: number
): number => {
  const preFilledCount = puzzle.startingBoard
    .flat()
    .filter(cell => cell !== null).length;
  const preFilledDifficultyMultiplier = 2.0 - preFilledCount / 4.0;
  const correctnessMultiplier = calculateCorrectnessMultiplier(
    firstTimeCorrectCells
  );

  return correctnessMultiplier * preFilledDifficultyMultiplier;
};

export const calculateRunningScore = (
  puzzle: Puzzle,
  feedback: FeedbackType[][],
  gameStats: GameStats
): number => {
  const { correctGuesses, firstTimeCorrectRows, firstTimeCorrectCols } =
    gameStats;

  const correctGuessPoints = correctGuesses * 50;
  const firstTimeCorrectBonus =
    (firstTimeCorrectRows + firstTimeCorrectCols) *
    SCORING.FIRST_TIME_CORRECT_BONUS;

  return correctGuessPoints + firstTimeCorrectBonus;
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
  const baseScore = 0;

  const { bonus: timeBonus, multiplier: timeMultiplier } =
    calculateTimeBonuses(timeInSeconds);
  const firstTimeCorrectBonus =
    (firstTimeCorrectRows + firstTimeCorrectCols) *
    SCORING.FIRST_TIME_CORRECT_BONUS;

  const perfectAccuracyBonus =
    isCompleted && wrongGuesses === 0 ? SCORING.PERFECT_ACCURACY_BONUS : 0;
  const efficiencyBonus =
    isCompleted && totalGuesses < SCORING.EFFICIENCY_THRESHOLD
      ? SCORING.EFFICIENCY_BONUS
      : 0;

  const difficultyMultiplier = calculateDifficultyMultiplier(
    puzzle,
    firstTimeCorrectCells
  );

  const subtotal =
    timeBonus + firstTimeCorrectBonus + perfectAccuracyBonus + efficiencyBonus;
  const totalScore = Math.round(
    subtotal * timeMultiplier * difficultyMultiplier
  );

  return {
    baseScore,
    timeBonus,
    timeMultiplier,
    firstTimeCorrectBonus,
    perfectAccuracyBonus,
    efficiencyBonus,
    difficultyMultiplier,
    totalScore,
  };
};

export const formatScore = (score: number): string => score.toLocaleString();
