/**
 * © 2025 Henry Burgess. All rights reserved.
 *
 * Numbl - A challenging number puzzle game
 * This file contains the main application component.
 */

import React, { useState, useEffect, useCallback } from 'react';
import '../styles/App.css';
import { Puzzle, FeedbackType } from '../types/puzzle';
import {
  getConstraintName,
  getConstraintValue,
  getConstraintType,
  isConstraintGuessedCorrect,
  isPuzzleComplete,
  getDuplicates,
  hasDuplicatesInLine,
  startingBoardToBoard,
} from '../utils/puzzleUtils';
import { formatTime } from '../utils/timeUtils';
import { PuzzleGenerator } from '../utils/puzzleGenerator';
import {
  calculateScore,
  calculateRunningScore,
  formatScore,
} from '../utils/scoringUtils';
import { ScoreBreakdown, GameStats } from '../types/puzzle';

const App: React.FC = () => {
  const puzzleGenerator = new PuzzleGenerator();
  const [board, setBoard] = useState<string[][]>(() =>
    startingBoardToBoard(puzzleGenerator.getTodaysPuzzle().startingBoard)
  );
  const [selected, setSelected] = useState<{ row: number; col: number }>({
    row: 0,
    col: 0,
  });
  const [feedback, setFeedback] = useState<FeedbackType[][]>(
    Array(4)
      .fill(null)
      .map(() => Array(4).fill('none'))
  );
  const [feedbackNumbers, setFeedbackNumbers] = useState<string[][]>(
    Array(4)
      .fill(null)
      .map(() => Array(4).fill(''))
  );
  const [arrowDirections, setArrowDirections] = useState<
    ('down' | 'right' | null)[][]
  >(
    Array(4)
      .fill(null)
      .map(() => Array(4).fill(null))
  );
  const [timer, setTimer] = useState(0);
  const [active, setActive] = useState(true);
  const [pendingGuesses, setPendingGuesses] = useState<
    Array<{ mode: 'row' | 'col'; index: number }>
  >([]);
  const [puzzle, setPuzzle] = useState<Puzzle>(
    puzzleGenerator.getTodaysPuzzle()
  );

  const [debugMode, setDebugMode] = useState(false);
  const [winModalOpen, setWinModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [difficulty] = useState<'easy' | 'hard'>('hard');
  const [keyboardPosition, setKeyboardPosition] = useState<'left' | 'right'>(
    () => {
      const saved = localStorage.getItem('numbl-keyboard-position');
      return saved === 'left' ? 'left' : 'right';
    }
  );
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('numbl-high-score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('numbl-difficulty', difficulty);
  }, [difficulty]);

  useEffect(() => {
    localStorage.setItem('numbl-keyboard-position', keyboardPosition);
  }, [keyboardPosition]);

  const [showConfetti, setShowConfetti] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalGuesses: 0,
    correctGuesses: 0,
    wrongGuesses: 0,
    firstTimeCorrectRows: 0,
    firstTimeCorrectCols: 0,
    firstTimeCorrectCells: 0,
    timeInSeconds: 0,
  });
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(
    null
  );
  const [currentScore, setCurrentScore] = useState(0);
  const [scoreVibrate, setScoreVibrate] = useState(false);
  const [guessedRows, setGuessedRows] = useState<Set<number>>(new Set());
  const [guessedCols, setGuessedCols] = useState<Set<number>>(new Set());
  const [isColumnFocus, setIsColumnFocus] = useState(false);
  const lastClickTime = React.useRef(0);
  const pressedKeys = React.useRef<Set<string>>(new Set());

  const duplicates = getDuplicates(board);

  const isPreFilledCell = (row: number, col: number): boolean => {
    return puzzle.startingBoard[row][col] !== null;
  };

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(
      () =>
        setTimer(t => {
          const newTime = t + 1;
          setGameStats(prev => ({ ...prev, timeInSeconds: newTime }));
          return newTime;
        }),
      1000
    );
    return () => clearInterval(interval);
  }, [active]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!active || e.repeat) return;

      const key = e.key;
      pressedKeys.current.add(key);

      if (key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setDebugMode(prev => !prev);
        return;
      }

      if (/^[1-9]$/.test(key)) {
        if (selected) {
          if (
            feedback[selected.row][selected.col] === 'correct' &&
            board[selected.row][selected.col] ===
              feedbackNumbers[selected.row][selected.col]
          ) {
            return;
          }
          handleNumberInput(key);
        }
        return;
      }

      if ((key === 'Backspace' || key === 'Delete') && selected) {
        const { row, col } = selected;
        if (
          feedback[row][col] === 'correct' &&
          board[row][col] === feedbackNumbers[row][col]
        ) {
          return;
        }
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = '';
        setBoard(newBoard);

        let newCol = col - 1;
        while (newCol >= 0 && isPreFilledCell(row, newCol)) {
          newCol--;
        }
        if (newCol >= 0) {
          setSelected({ row, col: newCol });
        }

        checkForGuessingEligibility(newBoard);
        return;
      }

      if (selected) {
        switch (key) {
          case 'ArrowLeft':
            let newCol = selected.col - 1;
            while (newCol >= 0 && isPreFilledCell(selected.row, newCol)) {
              newCol--;
            }
            if (newCol >= 0) {
              setSelected({ row: selected.row, col: newCol });
            }
            break;
          case 'ArrowRight':
            let newColRight = selected.col + 1;
            while (
              newColRight < 4 &&
              isPreFilledCell(selected.row, newColRight)
            ) {
              newColRight++;
            }
            if (newColRight < 4) {
              setSelected({ row: selected.row, col: newColRight });
            }
            break;
          case 'ArrowUp':
            e.preventDefault();
            let newRow = selected.row - 1;
            while (newRow >= 0 && isPreFilledCell(newRow, selected.col)) {
              newRow--;
            }
            if (newRow >= 0) {
              setSelected({ row: newRow, col: selected.col });
            }
            break;
          case 'ArrowDown':
            e.preventDefault();
            let newRowDown = selected.row + 1;
            while (
              newRowDown < 4 &&
              isPreFilledCell(newRowDown, selected.col)
            ) {
              newRowDown++;
            }
            if (newRowDown < 4) {
              setSelected({ row: newRowDown, col: selected.col });
            }
            break;
        }
      }

      if (key === 'Tab' || key === ' ') {
        e.preventDefault();
        setIsColumnFocus(!isColumnFocus);
        return;
      }

      if (key === 'Enter' && pendingGuesses.length > 0) {
        handleGuess();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selected,
    active,
    pendingGuesses,
    board,
    feedback,
    puzzle.solution,
    debugMode,
    duplicates.size,
    isColumnFocus,
  ]);

  const checkForGuessingEligibility = useCallback(
    (currentBoard: string[][], currentFeedback?: FeedbackType[][]) => {
      const feedbackToUse = currentFeedback || feedback;
      const newPendingGuesses: Array<{ mode: 'row' | 'col'; index: number }> =
        [];

      for (let row = 0; row < 4; row++) {
        if (
          currentBoard[row].every(cell => cell) &&
          !isConstraintGuessedCorrect(feedbackToUse, 'row', row) &&
          !guessedRows.has(row)
        ) {
          newPendingGuesses.push({ mode: 'row', index: row });
        }
      }

      for (let col = 0; col < 4; col++) {
        if (
          currentBoard.every(r => r[col]) &&
          !isConstraintGuessedCorrect(feedbackToUse, 'col', col) &&
          !guessedCols.has(col)
        ) {
          newPendingGuesses.push({ mode: 'col', index: col });
        }
      }

      setPendingGuesses(newPendingGuesses);
    },
    [feedback, guessedRows, guessedCols]
  );

  useEffect(() => {
    checkForGuessingEligibility(board);
  }, [board, checkForGuessingEligibility]);

  useEffect(() => {
    if (active) {
      const runningScore = calculateRunningScore(puzzle, feedback, gameStats);

      if (runningScore > currentScore) {
        setScoreVibrate(true);
        setTimeout(() => setScoreVibrate(false), 300);
      }

      setCurrentScore(runningScore);
    }
  }, [gameStats, feedback, puzzle, active, currentScore]);

  useEffect(() => {
    if (active && isPuzzleComplete(feedback)) {
      setActive(false);

      const finalStats = { ...gameStats, timeInSeconds: timer };
      const breakdown = calculateScore(puzzle, feedback, finalStats);
      setScoreBreakdown(breakdown);
      setCurrentScore(breakdown.totalScore);

      // Check for high score
      if (breakdown.totalScore > highScore) {
        setHighScore(breakdown.totalScore);
        localStorage.setItem(
          'numbl-high-score',
          breakdown.totalScore.toString()
        );
        setIsNewHighScore(true);
      } else {
        setIsNewHighScore(false);
      }

      setWinModalOpen(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [feedback, active, gameStats, timer, puzzle, highScore]);

  const handleNumberInput = (num: string) => {
    if (!selected) return;
    const { row, col } = selected;

    if (
      feedback[row][col] === 'correct' &&
      board[row][col] === feedbackNumbers[row][col]
    ) {
      return;
    }
    if (isPreFilledCell(row, col)) {
      return;
    }

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = num;
    setBoard(newBoard);

    const newFeedback = feedback.map(r => [...r]);
    const newFeedbackNumbers = feedbackNumbers.map(r => [...r]);
    const newArrowDirections = arrowDirections.map(r => [...r]);
    newFeedback[row][col] = 'none';
    newFeedbackNumbers[row][col] = '';
    newArrowDirections[row][col] = null;
    setFeedback(newFeedback);
    setFeedbackNumbers(newFeedbackNumbers);
    setArrowDirections(newArrowDirections);

    const newGuessedRows = new Set(guessedRows);
    const newGuessedCols = new Set(guessedCols);
    newGuessedRows.delete(row);
    newGuessedCols.delete(col);
    setGuessedRows(newGuessedRows);
    setGuessedCols(newGuessedCols);

    checkForGuessingEligibility(newBoard);

    if (isColumnFocus) {
      let newRow = row + 1;
      while (newRow < 4 && isPreFilledCell(newRow, col)) {
        newRow++;
      }
      if (newRow < 4) {
        setSelected({ row: newRow, col });
      }
    } else {
      let newCol = col + 1;
      while (newCol < 4 && isPreFilledCell(row, newCol)) {
        newCol++;
      }
      if (newCol < 4) {
        setSelected({ row, col: newCol });
      }
    }
  };

  const handleGuess = () => {
    if (pendingGuesses.length === 0) return;

    const previousFeedback = feedback.map(r => [...r]);
    const newFeedback = feedback.map(r => [...r]);
    const newFeedbackNumbers = feedbackNumbers.map(r => [...r]);
    const newArrowDirections = arrowDirections.map(r => [...r]);

    let newCorrectGuesses = 0;
    let newWrongGuesses = 0;
    let newFirstTimeCorrectRows = 0;
    let newFirstTimeCorrectCols = 0;
    let newFirstTimeCorrectCells = 0;

    for (const guess of pendingGuesses) {
      if (hasDuplicatesInLine(board, guess.mode, guess.index)) {
        continue;
      }

      if (guess.mode === 'row') {
        for (let c = 0; c < 4; c++) {
          const val = board[guess.index][c];
          if (val === String(puzzle.solution[guess.index][c])) {
            newFeedback[guess.index][c] = 'correct';
            newFeedbackNumbers[guess.index][c] = val;
            newCorrectGuesses++;
          } else if (puzzle.solution.some(row => row.includes(Number(val)))) {
            if (puzzle.solution[guess.index].includes(Number(val))) {
              newFeedback[guess.index][c] = 'misplaced';
              newFeedbackNumbers[guess.index][c] = val;
              newArrowDirections[guess.index][c] = 'right';
              newCorrectGuesses++;
            } else {
              const columnValues = puzzle.solution.map(row => row[c]);
              if (columnValues.includes(Number(val))) {
                newFeedback[guess.index][c] = 'misplaced';
                newFeedbackNumbers[guess.index][c] = val;
                newArrowDirections[guess.index][c] = 'down';
                newCorrectGuesses++;
              } else {
                newFeedback[guess.index][c] = 'wrong';
                newFeedbackNumbers[guess.index][c] = val;
                newArrowDirections[guess.index][c] = null;
                newWrongGuesses++;
              }
            }
          } else {
            newFeedback[guess.index][c] = 'wrong';
            newFeedbackNumbers[guess.index][c] = val;
            newWrongGuesses++;
          }
        }
      } else if (guess.mode === 'col') {
        for (let r = 0; r < 4; r++) {
          const val = board[r][guess.index];
          if (val === String(puzzle.solution[r][guess.index])) {
            newFeedback[r][guess.index] = 'correct';
            newFeedbackNumbers[r][guess.index] = val;
            newCorrectGuesses++;
          } else if (puzzle.solution.some(row => row.includes(Number(val)))) {
            const columnValues = puzzle.solution.map(row => row[guess.index]);
            if (columnValues.includes(Number(val))) {
              newFeedback[r][guess.index] = 'misplaced';
              newFeedbackNumbers[r][guess.index] = val;
              newArrowDirections[r][guess.index] = 'down';
              newCorrectGuesses++;
            } else {
              if (puzzle.solution[r].includes(Number(val))) {
                newFeedback[r][guess.index] = 'misplaced';
                newFeedbackNumbers[r][guess.index] = val;
                newArrowDirections[r][guess.index] = 'right';
                newCorrectGuesses++;
              } else {
                newFeedback[r][guess.index] = 'wrong';
                newFeedbackNumbers[r][guess.index] = val;
                newArrowDirections[r][guess.index] = null;
                newWrongGuesses++;
              }
            }
          } else {
            newFeedback[r][guess.index] = 'wrong';
            newFeedbackNumbers[r][guess.index] = val;
            newWrongGuesses++;
          }
        }
      }
    }

    for (const guess of pendingGuesses) {
      const line =
        guess.mode === 'row'
          ? newFeedback[guess.index]
          : newFeedback.map(row => row[guess.index]);
      const prevLine =
        guess.mode === 'row'
          ? previousFeedback[guess.index]
          : previousFeedback.map(row => row[guess.index]);

      const isNowCorrect = line.every(cell => cell === 'correct');
      const wasPreviouslyCorrect = prevLine.every(cell => cell === 'correct');

      if (isNowCorrect && !wasPreviouslyCorrect) {
        if (guess.mode === 'row') {
          newFirstTimeCorrectRows++;
        } else {
          newFirstTimeCorrectCols++;
        }
      }
    }

    for (const guess of pendingGuesses) {
      const line =
        guess.mode === 'row'
          ? newFeedback[guess.index]
          : newFeedback.map(row => row[guess.index]);
      const prevLine =
        guess.mode === 'row'
          ? previousFeedback[guess.index]
          : previousFeedback.map(row => row[guess.index]);

      const isNowCorrect = line.every(cell => cell === 'correct');
      const wasPreviouslyCorrect = prevLine.every(cell => cell === 'correct');
      const isFirstTimeCorrectLine = isNowCorrect && !wasPreviouslyCorrect;

      if (guess.mode === 'row') {
        for (let c = 0; c < 4; c++) {
          const currentFeedback = newFeedback[guess.index][c];
          const prevCellFeedback = previousFeedback[guess.index][c];

          if (
            currentFeedback === 'correct' &&
            prevCellFeedback !== 'correct' &&
            !isFirstTimeCorrectLine
          ) {
            newFirstTimeCorrectCells++;
          }
        }
      } else {
        for (let r = 0; r < 4; r++) {
          const currentFeedback = newFeedback[r][guess.index];
          const prevCellFeedback = previousFeedback[r][guess.index];

          if (
            currentFeedback === 'correct' &&
            prevCellFeedback !== 'correct' &&
            !isFirstTimeCorrectLine
          ) {
            newFirstTimeCorrectCells++;
          }
        }
      }
    }

    setFeedback(newFeedback);
    setFeedbackNumbers(newFeedbackNumbers);
    setArrowDirections(newArrowDirections);

    checkForGuessingEligibility(board, newFeedback);

    setGameStats(prev => ({
      ...prev,
      totalGuesses: prev.totalGuesses + pendingGuesses.length,
      correctGuesses: prev.correctGuesses + newCorrectGuesses,
      wrongGuesses: prev.wrongGuesses + newWrongGuesses,
      firstTimeCorrectRows: prev.firstTimeCorrectRows + newFirstTimeCorrectRows,
      firstTimeCorrectCols: prev.firstTimeCorrectCols + newFirstTimeCorrectCols,
      firstTimeCorrectCells:
        prev.firstTimeCorrectCells + newFirstTimeCorrectCells,
    }));

    const newGuessedRows = new Set(guessedRows);
    const newGuessedCols = new Set(guessedCols);

    for (const guess of pendingGuesses) {
      if (guess.mode === 'row') {
        newGuessedRows.add(guess.index);
      } else {
        newGuessedCols.add(guess.index);
      }
    }

    setGuessedRows(newGuessedRows);
    setGuessedCols(newGuessedCols);
  };

  const handleNewPuzzle = () => {
    const newPuzzle = puzzleGenerator.getTodaysPuzzle();

    setBoard(startingBoardToBoard(newPuzzle.startingBoard));
    setFeedback(
      Array(4)
        .fill(null)
        .map(() => Array(4).fill('none'))
    );
    setFeedbackNumbers(
      Array(4)
        .fill(null)
        .map(() => Array(4).fill(''))
    );
    setArrowDirections(
      Array(4)
        .fill(null)
        .map(() => Array(4).fill(null))
    );
    setTimer(0);
    setActive(true);
    setPendingGuesses([]);
    setWinModalOpen(false);
    setShowConfetti(false);
    setIsNewHighScore(false);
    setGameStats({
      totalGuesses: 0,
      correctGuesses: 0,
      wrongGuesses: 0,
      firstTimeCorrectRows: 0,
      firstTimeCorrectCols: 0,
      firstTimeCorrectCells: 0,
      timeInSeconds: 0,
    });
    setScoreBreakdown(null);
    setCurrentScore(0);
    setGuessedRows(new Set());
    setGuessedCols(new Set());
    setSelected({ row: 0, col: 0 });
    setIsColumnFocus(false);
    setPuzzle(newPuzzle);
  };

  const handleShareResult = () => {
    let finalScore = currentScore;
    if (scoreBreakdown) {
      const baseScore = currentScore;
      const totalBonuses =
        scoreBreakdown.timeBonus +
        scoreBreakdown.firstTimeCorrectBonus +
        scoreBreakdown.perfectAccuracyBonus +
        scoreBreakdown.efficiencyBonus;
      const scoreBeforeMultipliers = baseScore + totalBonuses;
      const totalMultiplier =
        scoreBreakdown.timeMultiplier * scoreBreakdown.difficultyMultiplier;
      finalScore = Math.round(scoreBeforeMultipliers * totalMultiplier);
    }

    const shareText = `I finished today's numbl in ${formatTime(timer)} with ${formatScore(finalScore)} points!\n\nTry and beat me: https://numbl.net`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(err => {
        // eslint-disable-next-line no-console
        console.error('Failed to copy: ', err);
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (feedback[row][col] === 'correct' || isPreFilledCell(row, col)) {
      return;
    }

    const now = Date.now();
    const lastClick = lastClickTime.current;
    lastClickTime.current = now;

    if (now - lastClick < 300 && selected.row === row && selected.col === col) {
      setIsColumnFocus(!isColumnFocus);
      return;
    }

    if (selected.row === row && selected.col === col) {
      setIsColumnFocus(!isColumnFocus);
      return;
    }

    setSelected({ row, col });
    checkForGuessingEligibility(board);
  };

  return (
    <div className="numbl-root">
      <div className="numbl-header">
        <div className="numbl-title-section">
          <div className="numbl-header-row">
            <div className="numbl-title-left">
              <img
                src={`${process.env.PUBLIC_URL}/numbl-icon.png`}
                alt="Numbl"
                className="numbl-header-icon"
              />
              <h1>numbl</h1>
            </div>
            <div className="numbl-date">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="numbl-grid-container">
        <div className="numbl-grid">
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`numbl-cell${selected && selected.row === rIdx && selected.col === cIdx ? ' selected' : ''} ${feedback[rIdx][cIdx] !== 'none' ? `feedback-${feedback[rIdx][cIdx]}` : ''} ${feedback[rIdx][cIdx] === 'misplaced' && arrowDirections[rIdx][cIdx] === 'right' ? ' arrow-right' : ''} ${duplicates.has(`${rIdx},${cIdx}`) ? 'duplicate' : ''} ${feedback[rIdx][cIdx] === 'correct' ? 'locked' : ''} ${isPreFilledCell(rIdx, cIdx) ? 'pre-filled' : ''} ${selected && ((!isColumnFocus && rIdx === selected.row) || (isColumnFocus && cIdx === selected.col)) && !isPreFilledCell(rIdx, cIdx) ? 'focus-highlight' : ''}`}
                onClick={() => handleCellClick(rIdx, cIdx)}
              >
                {cell}
              </div>
            ))
          )}
        </div>
      </div>
      <div className="numbl-constraints-container">
        {selected && (
          <div className="numbl-constraints-section">
            <div className="numbl-constraint-row">
              <span className="numbl-constraint-label">
                {isColumnFocus
                  ? `Column ${selected.col + 1}`
                  : `Row ${selected.row + 1}`}
              </span>
              <div
                className={`numbl-constraint-display ${isConstraintGuessedCorrect(feedback, isColumnFocus ? 'col' : 'row', isColumnFocus ? selected.col : selected.row) ? 'guessed-correct' : ''}`}
              >
                <span className="numbl-constraint-name">
                  {getConstraintName(
                    isColumnFocus
                      ? puzzle.colConstraints[selected.col]
                      : puzzle.rowConstraints[selected.row]
                  )}
                </span>
                {getConstraintValue(
                  isColumnFocus
                    ? puzzle.colConstraints[selected.col]
                    : puzzle.rowConstraints[selected.row]
                ) && (
                  <span
                    className={`numbl-constraint-value constraint-${getConstraintType(isColumnFocus ? puzzle.colConstraints[selected.col] : puzzle.rowConstraints[selected.row])}`}
                  >
                    {getConstraintValue(
                      isColumnFocus
                        ? puzzle.colConstraints[selected.col]
                        : puzzle.rowConstraints[selected.row]
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="numbl-inputs">
        {keyboardPosition === 'left' ? (
          <>
            <div className="numbl-keyboard-container">
              <div className="numbl-keyboard-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <button
                    key={n}
                    className="numbl-num-btn"
                    onClick={() => handleNumberInput(String(n))}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                className="numbl-guess-btn"
                onClick={handleGuess}
                disabled={
                  pendingGuesses.length === 0 ||
                  duplicates.size > 0 ||
                  pendingGuesses.some(guess =>
                    hasDuplicatesInLine(board, guess.mode, guess.index)
                  )
                }
              >
                Guess
              </button>
            </div>
            <div className="numbl-inputs-left">
              <div className="numbl-timer">
                <span className="stat-label">Time</span>
                {formatTime(timer)}
              </div>
              <div className={`numbl-score ${scoreVibrate ? 'vibrate' : ''}`}>
                <span className="stat-label">Score</span>
                {formatScore(currentScore)}
              </div>
              <button
                className="numbl-settings-btn"
                onClick={() => setSettingsModalOpen(true)}
              >
                Settings
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="numbl-inputs-left">
              <div className="numbl-timer">
                <span className="stat-label">Time</span>
                {formatTime(timer)}
              </div>
              <div className={`numbl-score ${scoreVibrate ? 'vibrate' : ''}`}>
                <span className="stat-label">Score</span>
                {formatScore(currentScore)}
              </div>
              <button
                className="numbl-settings-btn"
                onClick={() => setSettingsModalOpen(true)}
              >
                Settings
              </button>
            </div>
            <div className="numbl-keyboard-container">
              <div className="numbl-keyboard-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <button
                    key={n}
                    className="numbl-num-btn"
                    onClick={() => handleNumberInput(String(n))}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                className="numbl-guess-btn"
                onClick={handleGuess}
                disabled={
                  pendingGuesses.length === 0 ||
                  duplicates.size > 0 ||
                  pendingGuesses.some(guess =>
                    hasDuplicatesInLine(board, guess.mode, guess.index)
                  )
                }
              >
                Guess
              </button>
            </div>
          </>
        )}
      </div>

      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 50 }, (_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {winModalOpen && (
        <div className="win-modal">
          <div className="win-modal-content">
            <h2>numbl finished!</h2>
            {isNewHighScore && (
              <div className="high-score-banner">🏆 New High Score! 🏆</div>
            )}
            {scoreBreakdown && (
              <div className="score-breakdown">
                {(() => {
                  const baseScore = currentScore;
                  const totalBonuses =
                    scoreBreakdown.timeBonus +
                    scoreBreakdown.firstTimeCorrectBonus +
                    scoreBreakdown.perfectAccuracyBonus +
                    scoreBreakdown.efficiencyBonus;
                  const scoreBeforeMultipliers = baseScore + totalBonuses;
                  const totalMultiplier =
                    scoreBreakdown.timeMultiplier *
                    scoreBreakdown.difficultyMultiplier;
                  const finalTotalScore = Math.round(
                    scoreBeforeMultipliers * totalMultiplier
                  );

                  return (
                    <>
                      <div className="score-details">
                        <div className="score-row time-row">
                          <span>Time:</span>
                          <span>{formatTime(timer)}</span>
                        </div>
                        <div className="score-row">
                          <span>Base Score:</span>
                          <span>{formatScore(baseScore)}</span>
                        </div>
                        {scoreBreakdown.timeBonus > 0 && (
                          <div className="score-row">
                            <span>Time Bonus:</span>
                            <span>
                              +{formatScore(scoreBreakdown.timeBonus)}
                            </span>
                          </div>
                        )}
                        {scoreBreakdown.firstTimeCorrectBonus > 0 && (
                          <div className="score-row">
                            <span>First-Time Correct:</span>
                            <span>
                              +
                              {formatScore(
                                scoreBreakdown.firstTimeCorrectBonus
                              )}
                            </span>
                          </div>
                        )}
                        {scoreBreakdown.perfectAccuracyBonus > 0 && (
                          <div className="score-row">
                            <span>Perfect Accuracy:</span>
                            <span>
                              +
                              {formatScore(scoreBreakdown.perfectAccuracyBonus)}
                            </span>
                          </div>
                        )}
                        {scoreBreakdown.efficiencyBonus > 0 && (
                          <div className="score-row">
                            <span>Efficiency Bonus:</span>
                            <span>
                              +{formatScore(scoreBreakdown.efficiencyBonus)}
                            </span>
                          </div>
                        )}
                        <div className="score-row multipliers">
                          <span>Multipliers:</span>
                          <span>
                            {scoreBreakdown.difficultyMultiplier > 1.0 ? (
                              <span className="multiplier">
                                Correctness:{' '}
                                {scoreBreakdown.difficultyMultiplier.toFixed(1)}
                                x
                              </span>
                            ) : (
                              <span className="multiplier">None</span>
                            )}
                          </span>
                        </div>
                        <div className="score-row total">
                          <span>Total Score:</span>
                          <span>{formatScore(finalTotalScore)}</span>
                        </div>
                        <div className="score-row high-score">
                          <span>High Score:</span>
                          <span>
                            {formatScore(
                              isNewHighScore ? finalTotalScore : highScore
                            )}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
            <div className="win-modal-buttons">
              <button
                className="win-modal-btn primary"
                onClick={handleShareResult}
              >
                Share
              </button>
              <button
                className="win-modal-btn secondary"
                onClick={() => {
                  setWinModalOpen(false);
                  handleNewPuzzle();
                }}
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsModalOpen && (
        <div className="settings-modal">
          <div className="settings-modal-content">
            <h2>Settings</h2>

            <div className="settings-section">
              <h3>Difficulty</h3>
              <div className="difficulty-toggle">
                <label className="difficulty-option">
                  <input
                    type="radio"
                    name="difficulty"
                    value="easy"
                    checked={false}
                    disabled
                  />
                  <span className="difficulty-label">Easy</span>
                  <span className="difficulty-description">
                    Shows arrows for misplaced numbers (Coming Soon)
                  </span>
                </label>
                <label className="difficulty-option">
                  <input
                    type="radio"
                    name="difficulty"
                    value="hard"
                    checked={true}
                    disabled
                  />
                  <span className="difficulty-label">Hard</span>
                  <span className="difficulty-description">
                    No arrows - pure logic puzzle
                  </span>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h3>Keyboard Position</h3>
              <div className="difficulty-toggle">
                <label className="difficulty-option">
                  <input
                    type="radio"
                    name="keyboardPosition"
                    value="left"
                    checked={keyboardPosition === 'left'}
                    onChange={e =>
                      setKeyboardPosition(e.target.value as 'left' | 'right')
                    }
                  />
                  <span className="difficulty-label">Left</span>
                  <span className="difficulty-description">
                    Keyboard appears on the left side
                  </span>
                </label>
                <label className="difficulty-option">
                  <input
                    type="radio"
                    name="keyboardPosition"
                    value="right"
                    checked={keyboardPosition === 'right'}
                    onChange={e =>
                      setKeyboardPosition(e.target.value as 'left' | 'right')
                    }
                  />
                  <span className="difficulty-label">Right</span>
                  <span className="difficulty-description">
                    Keyboard appears on the right side
                  </span>
                </label>
              </div>
            </div>

            <div className="settings-version">
              Version 0.1.0 • Made by{' '}
              <a
                href="https://github.com/henryjburg"
                target="_blank"
                rel="noopener noreferrer"
              >
                @henryjburg
              </a>
            </div>

            <div className="settings-modal-buttons">
              <button
                className="settings-modal-btn primary"
                onClick={() => setSettingsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
