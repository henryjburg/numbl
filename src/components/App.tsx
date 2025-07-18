import React, { useState, useEffect } from 'react';
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

  // Track duplicates
  const duplicates = getDuplicates(board);

  // Track pre-filled cells (starting board cells)
  const isPreFilledCell = (row: number, col: number): boolean => {
    return puzzle.startingBoard[row][col] !== null;
  };

  // Timer
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

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!active) return;

      const key = e.key;

      // Prevent key repeat events
      if (e.repeat) return;

      // Track pressed keys
      pressedKeys.current.add(key);

      // Debug mode toggle (Ctrl+D)
      if (key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setDebugMode(prev => !prev);
        return;
      }

      // Physical keyboard number input for digits 1-9
      if (/^[1-9]$/.test(key)) {
        if (selected) {
          // Don't allow input if the cell is already correct
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

      // Backspace/Delete to clear cell and move left
      if ((key === 'Backspace' || key === 'Delete') && selected) {
        const { row, col } = selected;
        // Don't allow clearing numbers that are correct
        if (
          feedback[row][col] === 'correct' &&
          board[row][col] === feedbackNumbers[row][col]
        ) {
          return;
        }
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = '';
        setBoard(newBoard);

        // Move to left if available, skipping pre-filled cells
        let newCol = col - 1;
        while (newCol >= 0 && isPreFilledCell(row, newCol)) {
          newCol--;
        }
        if (newCol >= 0) {
          setSelected({ row, col: newCol });
        }

        // Re-check for guessing eligibility since we cleared a cell
        checkForGuessingEligibility(newBoard);
        return;
      }

      // Arrow key navigation
      if (selected) {
        switch (key) {
          case 'ArrowLeft':
            // Move to previous column in same row (regardless of focus mode)
            let newCol = selected.col - 1;
            while (newCol >= 0 && isPreFilledCell(selected.row, newCol)) {
              newCol--;
            }
            if (newCol >= 0) {
              setSelected({ row: selected.row, col: newCol });
            }
            break;
          case 'ArrowRight':
            // Move to next column in same row (regardless of focus mode)
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
            if (isColumnFocus) {
              // In column focus, move to previous row in same column
              let newRow = selected.row - 1;
              while (newRow >= 0 && isPreFilledCell(newRow, selected.col)) {
                newRow--;
              }
              if (newRow >= 0) {
                setSelected({ row: newRow, col: selected.col });
              }
            } else {
              // In row focus, move to previous row in same column
              let newRow = selected.row - 1;
              while (newRow >= 0 && isPreFilledCell(newRow, selected.col)) {
                newRow--;
              }
              if (newRow >= 0) {
                setSelected({ row: newRow, col: selected.col });
              }
            }
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (isColumnFocus) {
              // In column focus, move to next row in same column
              let newRow = selected.row + 1;
              while (newRow < 4 && isPreFilledCell(newRow, selected.col)) {
                newRow++;
              }
              if (newRow < 4) {
                setSelected({ row: newRow, col: selected.col });
              }
            } else {
              // In row focus, move to next row in same column
              let newRow = selected.row + 1;
              while (newRow < 4 && isPreFilledCell(newRow, selected.col)) {
                newRow++;
              }
              if (newRow < 4) {
                setSelected({ row: newRow, col: selected.col });
              }
            }
            break;
        }
      }

      // Tab or Space key to toggle focus
      if (key === 'Tab' || key === ' ') {
        e.preventDefault();
        setIsColumnFocus(!isColumnFocus);
        return;
      }

      // Enter key to guess
      if (key === 'Enter' && pendingGuesses.length > 0) {
        handleGuess();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Remove key from pressed keys set
      pressedKeys.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
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

  // Check for guessing eligibility whenever board changes
  useEffect(() => {
    checkForGuessingEligibility(board);
  }, [board, feedback]);

  // Calculate running score whenever game stats change
  useEffect(() => {
    if (active) {
      const runningScore = calculateRunningScore(puzzle, feedback, gameStats);

      // Trigger vibration if score increased
      if (runningScore > currentScore) {
        setScoreVibrate(true);
        setTimeout(() => setScoreVibrate(false), 300);
      }

      setCurrentScore(runningScore);
    }
  }, [gameStats, feedback, puzzle, active]);

  // Handle puzzle completion
  useEffect(() => {
    if (active && isPuzzleComplete(feedback)) {
      setActive(false);

      // Calculate final score
      const finalStats = { ...gameStats, timeInSeconds: timer };
      const breakdown = calculateScore(puzzle, feedback, finalStats);
      setScoreBreakdown(breakdown);
      setCurrentScore(breakdown.totalScore);

      setWinModalOpen(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [feedback, active, gameStats, timer, puzzle]);

  // Check all rows and columns for guessing eligibility
  const checkForGuessingEligibility = (
    currentBoard: string[][],
    currentFeedback?: FeedbackType[][]
  ) => {
    const feedbackToUse = currentFeedback || feedback;
    const newPendingGuesses: Array<{ mode: 'row' | 'col'; index: number }> = [];

    // Check all rows
    for (let row = 0; row < 4; row++) {
      if (
        currentBoard[row].every(cell => cell) &&
        !isConstraintGuessedCorrect(feedbackToUse, 'row', row)
      ) {
        // Only allow guessing if this row hasn't been guessed yet
        if (!guessedRows.has(row)) {
          newPendingGuesses.push({ mode: 'row', index: row });
        }
      }
    }

    // Check all columns
    for (let col = 0; col < 4; col++) {
      if (
        currentBoard.every(r => r[col]) &&
        !isConstraintGuessedCorrect(feedbackToUse, 'col', col)
      ) {
        // Only allow guessing if this column hasn't been guessed yet
        if (!guessedCols.has(col)) {
          newPendingGuesses.push({ mode: 'col', index: col });
        }
      }
    }

    setPendingGuesses(newPendingGuesses);
  };

  // Handle number input
  const handleNumberInput = (num: string) => {
    if (!selected) return;
    const { row, col } = selected;
    // Don't allow changing numbers that are correct or pre-filled
    if (
      feedback[row][col] === 'correct' &&
      board[row][col] === feedbackNumbers[row][col]
    ) {
      return;
    }
    // Don't allow changing pre-filled cells
    if (isPreFilledCell(row, col)) {
      return;
    }
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = num;
    setBoard(newBoard);

    // Clear feedback for this cell since the number changed
    const newFeedback = feedback.map(r => [...r]);
    const newFeedbackNumbers = feedbackNumbers.map(r => [...r]);
    const newArrowDirections = arrowDirections.map(r => [...r]);
    newFeedback[row][col] = 'none';
    newFeedbackNumbers[row][col] = '';
    newArrowDirections[row][col] = null;
    setFeedback(newFeedback);
    setFeedbackNumbers(newFeedbackNumbers);
    setArrowDirections(newArrowDirections);

    // Allow re-guessing this row and column since it was modified
    const newGuessedRows = new Set(guessedRows);
    const newGuessedCols = new Set(guessedCols);
    newGuessedRows.delete(row);
    newGuessedCols.delete(col);
    setGuessedRows(newGuessedRows);
    setGuessedCols(newGuessedCols);

    // Check all rows and columns for guessing eligibility
    checkForGuessingEligibility(newBoard);

    // Advance to next cell in current focus direction
    if (isColumnFocus) {
      // In column focus, move to next row in same column
      let newRow = row + 1;
      while (newRow < 4 && isPreFilledCell(newRow, col)) {
        newRow++;
      }
      if (newRow < 4) {
        setSelected({ row: newRow, col });
      }
    } else {
      // In row focus, move to next column in same row
      let newCol = col + 1;
      while (newCol < 4 && isPreFilledCell(row, newCol)) {
        newCol++;
      }
      if (newCol < 4) {
        setSelected({ row, col: newCol });
      }
    }
  };

  // Handle guess
  const handleGuess = () => {
    if (pendingGuesses.length === 0) return;

    // Store previous feedback for first-time correct tracking
    const previousFeedback = feedback.map(r => [...r]);

    // Process all pending guesses at once
    const newFeedback = feedback.map(r => [...r]);
    const newFeedbackNumbers = feedbackNumbers.map(r => [...r]);
    const newArrowDirections = arrowDirections.map(r => [...r]);

    let newCorrectGuesses = 0;
    let newWrongGuesses = 0;
    let newFirstTimeCorrectRows = 0;
    let newFirstTimeCorrectCols = 0;
    let newFirstTimeCorrectCells = 0;

    for (const guess of pendingGuesses) {
      // Don't allow guessing if the row/column has duplicates
      if (hasDuplicatesInLine(board, guess.mode, guess.index)) {
        continue;
      }

      if (guess.mode === 'row') {
        for (let c = 0; c < 4; c++) {
          const val = board[guess.index][c];
          if (val === String(puzzle.solution[guess.index][c])) {
            newFeedback[guess.index][c] = 'correct';
            newFeedbackNumbers[guess.index][c] = val;
            newCorrectGuesses++; // Correct position
          } else if (puzzle.solution.some(row => row.includes(Number(val)))) {
            // Number exists in puzzle - check if it's in this row or column
            if (puzzle.solution[guess.index].includes(Number(val))) {
              // Number exists in this row but wrong position - show as misplaced with right arrow
              newFeedback[guess.index][c] = 'misplaced';
              newFeedbackNumbers[guess.index][c] = val;
              newArrowDirections[guess.index][c] = 'right';
              newCorrectGuesses++; // Correct number, wrong position
            } else {
              // Number exists in puzzle but not in this row - check if it's in this column
              const columnValues = puzzle.solution.map(row => row[c]);
              if (columnValues.includes(Number(val))) {
                // Number exists in this column but different row - show as misplaced with down arrow
                newFeedback[guess.index][c] = 'misplaced';
                newFeedbackNumbers[guess.index][c] = val;
                newArrowDirections[guess.index][c] = 'down';
                newCorrectGuesses++; // Exists in this column
              } else {
                // Number exists in puzzle but not in this row or column - show as wrong
                newFeedback[guess.index][c] = 'wrong';
                newFeedbackNumbers[guess.index][c] = val;
                newArrowDirections[guess.index][c] = null;
                newWrongGuesses++;
              }
            }
          } else {
            // Number doesn't exist in puzzle at all
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
            newCorrectGuesses++; // Correct position
          } else if (puzzle.solution.some(row => row.includes(Number(val)))) {
            // Number exists in puzzle - check if it's in this row or column
            const columnValues = puzzle.solution.map(row => row[guess.index]);
            if (columnValues.includes(Number(val))) {
              // Number exists in this column but wrong position - show as misplaced with down arrow
              newFeedback[r][guess.index] = 'misplaced';
              newFeedbackNumbers[r][guess.index] = val;
              newArrowDirections[r][guess.index] = 'down';
              newCorrectGuesses++; // Correct number, wrong position
            } else {
              // Number exists in puzzle but not in this column - check if it's in this row
              if (puzzle.solution[r].includes(Number(val))) {
                // Number exists in this row but different column - show as misplaced with right arrow
                newFeedback[r][guess.index] = 'misplaced';
                newFeedbackNumbers[r][guess.index] = val;
                newArrowDirections[r][guess.index] = 'right';
                newCorrectGuesses++; // Exists in this row
              } else {
                // Number exists in puzzle but not in this column or row - show as wrong
                newFeedback[r][guess.index] = 'wrong';
                newFeedbackNumbers[r][guess.index] = val;
                newArrowDirections[r][guess.index] = null;
                newWrongGuesses++;
              }
            }
          } else {
            // Number doesn't exist in puzzle at all
            newFeedback[r][guess.index] = 'wrong';
            newFeedbackNumbers[r][guess.index] = val;
            newWrongGuesses++;
          }
        }
      }
    }

    // Check for first-time correct guesses
    for (const guess of pendingGuesses) {
      const line =
        guess.mode === 'row'
          ? newFeedback[guess.index]
          : newFeedback.map(row => row[guess.index]);
      const prevLine =
        guess.mode === 'row'
          ? previousFeedback[guess.index]
          : previousFeedback.map(row => row[guess.index]);

      // Check if this line just became fully correct
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

    // Check for individual first-time correct cells (excluding those that contribute to First Time Correct Bonus)
    for (const guess of pendingGuesses) {
      const line =
        guess.mode === 'row'
          ? newFeedback[guess.index]
          : newFeedback.map(row => row[guess.index]);
      const prevLine =
        guess.mode === 'row'
          ? previousFeedback[guess.index]
          : previousFeedback.map(row => row[guess.index]);

      // Check if this line just became fully correct (for First Time Correct Bonus)
      const isNowCorrect = line.every(cell => cell === 'correct');
      const wasPreviouslyCorrect = prevLine.every(cell => cell === 'correct');
      const isFirstTimeCorrectLine = isNowCorrect && !wasPreviouslyCorrect;

      if (guess.mode === 'row') {
        for (let c = 0; c < 4; c++) {
          const currentFeedback = newFeedback[guess.index][c];
          const prevCellFeedback = previousFeedback[guess.index][c];

          // Count cells that just became correct for the first time
          // BUT exclude them if this entire row just became correct (to avoid double-counting)
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

          // Count cells that just became correct for the first time
          // BUT exclude them if this entire column just became correct (to avoid double-counting)
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

    // After processing guesses, check if there are any new eligible constraints
    checkForGuessingEligibility(board, newFeedback);

    // Update game stats with accurate counts
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

    // Track which rows and columns have been guessed
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

  // Handle new puzzle
  const handleNewPuzzle = () => {
    // Generate new puzzle for today
    const newPuzzle = puzzleGenerator.getTodaysPuzzle();

    // Reset game state
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

    // Set the new puzzle
    setPuzzle(newPuzzle);
  };

  // Handle sharing result
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
        console.error('Failed to copy: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  // Handle cell selection
  const handleCellClick = (row: number, col: number) => {
    // Prevent selecting cells that are already correct or pre-filled
    if (feedback[row][col] === 'correct' || isPreFilledCell(row, col)) {
      return;
    }

    // Check if this is a double-click (double-tap on mobile)
    const now = Date.now();
    const lastClick = lastClickTime.current;
    lastClickTime.current = now;

    if (now - lastClick < 300 && selected.row === row && selected.col === col) {
      // Double-click detected - toggle focus
      setIsColumnFocus(!isColumnFocus);
      return;
    }

    // Check if clicking on already selected cell - toggle focus
    if (selected.row === row && selected.col === col) {
      setIsColumnFocus(!isColumnFocus);
      return;
    }

    setSelected({ row, col });
    // Re-check for guessing eligibility when selecting a different cell
    checkForGuessingEligibility(board);
  };

  // Handle constraint section clicks
  const handleRowConstraintClick = () => {
    if (!active || !selected) return;
    setIsColumnFocus(false);
  };

  const handleColumnConstraintClick = () => {
    if (!active || !selected) return;
    setIsColumnFocus(true);
  };

  // Render
  return (
    <div className="numbl-root">
      <div className="numbl-header">
        <div className="numbl-title-section">
          <h1>numbl</h1>
          <div className="numbl-credits">
            Made by{' '}
            <a
              href="https://github.com/henryjburg"
              target="_blank"
              rel="noopener noreferrer"
            >
              @henryjburg
            </a>
          </div>
        </div>
        <div className="numbl-stats">
          <div className="numbl-timer">
            <span className="emoji" role="img" aria-label="timer">
              ⏰
            </span>{' '}
            {formatTime(timer)}
          </div>
          <div className={`numbl-score ${scoreVibrate ? 'vibrate' : ''}`}>
            <span className="emoji" role="img" aria-label="trophy">
              🏆
            </span>{' '}
            {formatScore(currentScore)}
          </div>
        </div>
      </div>
      <div className="numbl-constraints-container">
        {selected && (
          <div className="numbl-constraints-grid">
            <div
              className={`numbl-constraints-section ${!isColumnFocus ? 'focused' : ''}`}
              onClick={handleRowConstraintClick}
            >
              <h3>Row {selected.row + 1}</h3>
              <div className="numbl-constraints-list">
                <div className="numbl-constraint-item">
                  <div
                    className={`numbl-constraint-display ${isConstraintGuessedCorrect(feedback, 'row', selected.row) ? 'guessed-correct' : ''}`}
                  >
                    <span className="numbl-constraint-name">
                      {getConstraintName(puzzle.rowConstraints[selected.row])}
                    </span>
                    {getConstraintValue(
                      puzzle.rowConstraints[selected.row]
                    ) && (
                      <span
                        className={`numbl-constraint-value constraint-${getConstraintType(puzzle.rowConstraints[selected.row])}`}
                      >
                        {getConstraintValue(
                          puzzle.rowConstraints[selected.row]
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div
              className={`numbl-constraints-section ${isColumnFocus ? 'focused' : ''}`}
              onClick={handleColumnConstraintClick}
            >
              <h3>Column {selected.col + 1}</h3>
              <div className="numbl-constraints-list">
                <div className="numbl-constraint-item">
                  <div
                    className={`numbl-constraint-display ${isConstraintGuessedCorrect(feedback, 'col', selected.col) ? 'guessed-correct' : ''}`}
                  >
                    <span className="numbl-constraint-name">
                      {getConstraintName(puzzle.colConstraints[selected.col])}
                    </span>
                    {getConstraintValue(
                      puzzle.colConstraints[selected.col]
                    ) && (
                      <span
                        className={`numbl-constraint-value constraint-${getConstraintType(puzzle.colConstraints[selected.col])}`}
                      >
                        {getConstraintValue(
                          puzzle.colConstraints[selected.col]
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="numbl-grid-container">
        <table className="numbl-grid">
          <tbody>
            {board.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`numbl-cell${selected && selected.row === rIdx && selected.col === cIdx ? ' selected' : ''} ${feedback[rIdx][cIdx] !== 'none' ? `feedback-${feedback[rIdx][cIdx]}` : ''} ${feedback[rIdx][cIdx] === 'misplaced' && arrowDirections[rIdx][cIdx] === 'right' ? ' arrow-right' : ''} ${duplicates.has(`${rIdx},${cIdx}`) ? 'duplicate' : ''} ${feedback[rIdx][cIdx] === 'correct' ? 'locked' : ''} ${isPreFilledCell(rIdx, cIdx) ? 'pre-filled' : ''} ${selected && ((!isColumnFocus && rIdx === selected.row) || (isColumnFocus && cIdx === selected.col)) && !isPreFilledCell(rIdx, cIdx) ? 'focus-highlight' : ''}`}
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    // Only apply background via CSS classes now
                  >
                    {cell}
                    {feedback[rIdx][cIdx] === 'misplaced' &&
                      arrowDirections[rIdx][cIdx] === 'down' && (
                        <span
                          style={{ position: 'absolute', top: 4, right: 4 }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="#222"
                          >
                            <rect
                              x="7"
                              y="2"
                              width="2"
                              height="8"
                              fill="#222"
                            />
                            <polygon points="4,10 8,14 12,10" fill="#222" />
                          </svg>
                        </span>
                      )}
                    {feedback[rIdx][cIdx] === 'misplaced' &&
                      arrowDirections[rIdx][cIdx] === 'right' && (
                        <span
                          style={{ position: 'absolute', top: 4, right: 4 }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="#222"
                          >
                            <rect
                              x="2"
                              y="7"
                              width="8"
                              height="2"
                              fill="#222"
                            />
                            <polygon points="10,4 14,8 10,12" fill="#222" />
                          </svg>
                        </span>
                      )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="numbl-puzzle-id">Today's Puzzle</div>
      </div>
      <div className="numbl-inputs">
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
            <div className="puzzle-id">Today's Puzzle</div>
            {scoreBreakdown && (
              <div className="score-breakdown">
                {(() => {
                  // Calculate total score: base + bonuses, then apply multipliers
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
    </div>
  );
};

export default App;
