/**
 * © 2025 Henry Burgess. All rights reserved.
 *
 * Time Utilities - Time formatting for the game
 */

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
