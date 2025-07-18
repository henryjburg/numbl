import React, { useState, useEffect, useCallback } from 'react';
import '../styles/App.css';
import { Puzzle, FeedbackType, Constraint } from '../types/puzzle';
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
import Grid from './Grid';
import Keyboard from './Keyboard';
import ConstraintDisplay from './ConstraintDisplay';
import WinModal from './WinModal';
import SettingsModal from './SettingsModal';
import HelpModal from './HelpModal';

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
  const [isDailyPuzzle, setIsDailyPuzzle] = useState(true);

  const [debugMode, setDebugMode] = useState(false);
  const [winModalOpen, setWinModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [helpPage, setHelpPage] = useState(0);
  const [difficulty] = useState<'easy' | 'hard'>('hard');

  // Check if this is the user's first visit
  const [hasSeenHelp, setHasSeenHelp] = useState<boolean>(() => {
    const saved = localStorage.getItem('numbl-has-seen-help');
    return saved === 'true';
  });

  // Constraint tooltip state
  const [constraintTooltipVisible, setConstraintTooltipVisible] =
    useState(false);
  const [constraintTooltipText, setConstraintTooltipText] = useState('');

  const helpPages = [
    {
      title: 'Welcome to Numbl!',
      content: (
        <div className="settings-section">
          <h3>🎯 The Goal</h3>
          <p className="help-text">
            Fill in the 4x4 grid with numbers 1-9 so that each row and column
            satisfies its mathematical constraint. Each day brings a new puzzle
            to solve!
          </p>
          <div className="help-rules">
            <div className="help-rule">
              <span className="help-rule-number">1.</span>
              <span className="help-rule-text">
                Use numbers 1-9 only (no zeros!)
              </span>
            </div>
            <div className="help-rule">
              <span className="help-rule-number">2.</span>
              <span className="help-rule-text">
                Numbers can appear multiple times, but not in the same row or
                column (like Sudoku)
              </span>
            </div>
            <div className="help-rule">
              <span className="help-rule-number">3.</span>
              <span className="help-rule-text">
                Some cells are pre-filled and can't be changed
              </span>
            </div>
            <div className="help-rule">
              <span className="help-rule-number">4.</span>
              <span className="help-rule-text">
                Complete rows and columns to check your answers
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'How to Play',
      content: (
        <div className="settings-section">
          <h3>🎮 Gameplay Steps</h3>
          <div className="help-steps">
            <div className="help-step">
              <span className="help-step-number">1.</span>
              <span className="help-step-text">
                Click on any empty cell to select it
              </span>
            </div>
            <div className="help-step">
              <span className="help-step-number">2.</span>
              <span className="help-step-text">
                Type a number (1-9) or use the number buttons
              </span>
            </div>
            <div className="help-step">
              <span className="help-step-number">3.</span>
              <span className="help-step-text">
                When a row or column is full, click "Guess" to check it
              </span>
            </div>
            <div className="help-step">
              <span className="help-step-number">4.</span>
              <span className="help-step-text">
                Tap cells or use the arrow keys to navigate between cells
              </span>
            </div>
            <div className="help-step">
              <span className="help-step-number">5.</span>
              <span className="help-step-text">
                Click the cell or press Space to switch between row and column
                focus
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Understanding Feedback',
      content: (
        <div className="settings-section">
          <h3>🎨 Guess Feedback</h3>
          <div className="help-feedback">
            <div className="help-feedback-item">
              <div className="help-feedback-color correct"></div>
              <span className="help-feedback-text">
                Green = Correct number in correct position
              </span>
            </div>
            <div className="help-feedback-item">
              <div className="help-feedback-color misplaced"></div>
              <span className="help-feedback-text">
                Yellow = Correct number in wrong position, either in that row or
                column
              </span>
            </div>
            <div className="help-feedback-item">
              <div className="help-feedback-color wrong"></div>
              <span className="help-feedback-text">Gray = Wrong number</span>
            </div>
            <div className="help-feedback-item">
              <div className="help-feedback-color duplicate"></div>
              <span className="help-feedback-text">
                Red = Duplicate in row or column
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Scoring & Strategy',
      content: (
        <div className="settings-section">
          <h3>🏆 Scoring System</h3>
          <p className="help-text">
            Bonuses are multiplied by difficulty. Harder puzzles = higher
            multipliers!
          </p>
          <div className="help-scoring">
            <div className="help-scoring-item">
              <span className="help-scoring-icon">⚡</span>
              <span className="help-scoring-text">
                Time: 500 points (under 1 min)
              </span>
            </div>
            <div className="help-scoring-item">
              <span className="help-scoring-icon">🎯</span>
              <span className="help-scoring-text">
                Perfect: 300 points (no wrong guesses)
              </span>
            </div>
            <div className="help-scoring-item">
              <span className="help-scoring-icon">🚀</span>
              <span className="help-scoring-text">
                Efficiency: 200 points (under 8 guesses)
              </span>
            </div>
            <div className="help-scoring-item">
              <span className="help-scoring-icon">⭐</span>
              <span className="help-scoring-text">
                First-Time: 100 points per correct row/column
              </span>
            </div>
            <div className="help-scoring-item">
              <span className="help-scoring-icon">📈</span>
              <span className="help-scoring-text">
                Multiplier: Based on puzzle difficulty & accuracy
              </span>
            </div>
          </div>
        </div>
      ),
    },
  ];

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

  // Show help modal on first visit
  useEffect(() => {
    if (!hasSeenHelp) {
      setHelpModalOpen(true);
      setHasSeenHelp(true);
      localStorage.setItem('numbl-has-seen-help', 'true');
    }
  }, [hasSeenHelp]);

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
        // Count pre-filled cells in this row
        const preFilledCount = currentBoard[row].filter(
          (cell, col) => puzzle.startingBoard[row][col] !== null
        ).length;

        if (
          currentBoard[row].every(cell => cell) &&
          !isConstraintGuessedCorrect(feedbackToUse, 'row', row) &&
          !guessedRows.has(row) &&
          preFilledCount < 4 // Don't allow guessing if row has 4 pre-filled cells
        ) {
          newPendingGuesses.push({ mode: 'row', index: row });
        }
      }

      for (let col = 0; col < 4; col++) {
        // Count pre-filled cells in this column
        const preFilledCount = currentBoard.filter(
          (_, row) => puzzle.startingBoard[row][col] !== null
        ).length;

        if (
          currentBoard.every(r => r[col]) &&
          !isConstraintGuessedCorrect(feedbackToUse, 'col', col) &&
          !guessedCols.has(col) &&
          preFilledCount < 4 // Don't allow guessing if column has 4 pre-filled cells
        ) {
          newPendingGuesses.push({ mode: 'col', index: col });
        }
      }

      setPendingGuesses(newPendingGuesses);
    },
    [feedback, guessedRows, guessedCols, puzzle.startingBoard]
  );

  useEffect(() => {
    checkForGuessingEligibility(board);
  }, [board, checkForGuessingEligibility]);

  useEffect(() => {
    if (active) {
      const runningScore = calculateRunningScore(
        puzzle,
        feedback,
        gameStats,
        guessedRows,
        guessedCols
      );

      if (runningScore > currentScore) {
        setScoreVibrate(true);
        setTimeout(() => setScoreVibrate(false), 300);
      }

      setCurrentScore(runningScore);
    }
  }, [
    gameStats,
    feedback,
    puzzle,
    active,
    currentScore,
    guessedRows,
    guessedCols,
  ]);

  useEffect(() => {
    if (active && isPuzzleComplete(feedback)) {
      setActive(false);

      const finalStats = { ...gameStats, timeInSeconds: timer };
      const breakdown = calculateScore(
        puzzle,
        feedback,
        finalStats,
        guessedRows,
        guessedCols
      );
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
  }, [
    feedback,
    active,
    gameStats,
    timer,
    puzzle,
    highScore,
    guessedRows,
    guessedCols,
  ]);

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

  const handleRestartDailyPuzzle = () => {
    // Get today's puzzle to restart the daily game
    const todaysPuzzle = puzzleGenerator.getTodaysPuzzle();

    // Clear pending guesses first to prevent Guess button from being enabled
    setPendingGuesses([]);

    setBoard(startingBoardToBoard(todaysPuzzle.startingBoard));
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
    setPuzzle(todaysPuzzle);
    setIsDailyPuzzle(true);
  };

  const handleNewRandomGame = () => {
    // Generate a random date to create a different puzzle
    const randomDate = new Date(
      Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split('T')[0];
    const newPuzzle = puzzleGenerator.generatePuzzle(randomDate);

    // Clear pending guesses first to prevent Guess button from being enabled
    setPendingGuesses([]);

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
    setIsDailyPuzzle(false);
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

  const handleHelpOpen = () => {
    setHelpPage(0);
    setHelpModalOpen(true);
  };

  const handleHelpClose = () => {
    setHelpModalOpen(false);
    setHelpPage(0);
  };

  const handleHelpPageChange = (newPage: number) => {
    setHelpPage(newPage);
  };

  const generateConstraintDescription = (
    constraint: Constraint,
    lineType: 'row' | 'col'
  ): string => {
    const lineText = lineType === 'row' ? 'row' : 'column';

    if (constraint.sum) {
      return `Sum of numbers\nin this ${lineText}: ${constraint.sum}`;
    }

    if (constraint.even === true) {
      return `All numbers in this ${lineText}\nmust be even`;
    }

    if (constraint.even === false) {
      return `All numbers in this ${lineText}\nmust be odd`;
    }

    if (constraint.contains) {
      const numbers = constraint.contains.sort((a, b) => a - b).join(', ');
      return `Must contain:\n${numbers}`;
    }

    if (constraint.range) {
      return `Numbers between\n${constraint.range.min} and ${constraint.range.max}`;
    }

    return '';
  };

  const handleConstraintInfoShow = (
    event: React.MouseEvent,
    constraint: Constraint,
    lineType: 'row' | 'col'
  ) => {
    const description = generateConstraintDescription(constraint, lineType);
    if (description) {
      setConstraintTooltipText(description);
      setConstraintTooltipVisible(true);
    }
  };

  const handleConstraintInfoHide = () => {
    setConstraintTooltipVisible(false);
  };

  return (
    <div className="numbl-root">
      <div className="numbl-desktop-container">
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
                {isDailyPuzzle
                  ? `Daily: ${new Date().toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                    })}`
                  : 'Random'}
              </div>
            </div>
          </div>
        </div>
        <div className="numbl-desktop-left-column">
          <div className="numbl-grid-container">
            <Grid
              board={board}
              selected={selected}
              feedback={feedback}
              arrowDirections={arrowDirections}
              duplicates={duplicates}
              isPreFilledCell={isPreFilledCell}
              isColumnFocus={isColumnFocus}
              handleCellClick={handleCellClick}
            />
          </div>
          <div className="numbl-desktop-right-column">
            <div className="numbl-constraints-container">
              <ConstraintDisplay
                selected={selected}
                isColumnFocus={isColumnFocus}
                feedback={feedback}
                puzzle={puzzle}
                getConstraintName={getConstraintName}
                getConstraintValue={getConstraintValue}
                getConstraintType={getConstraintType}
                isConstraintGuessedCorrect={isConstraintGuessedCorrect}
                constraintTooltipVisible={constraintTooltipVisible}
                constraintTooltipText={constraintTooltipText}
                handleConstraintInfoShow={handleConstraintInfoShow}
                handleConstraintInfoHide={handleConstraintInfoHide}
              />
            </div>

            <div className="numbl-inputs">
              <Keyboard
                keyboardPosition={keyboardPosition}
                handleNumberInput={handleNumberInput}
                handleGuess={handleGuess}
                pendingGuesses={pendingGuesses}
                duplicates={duplicates}
                board={board}
                hasDuplicatesInLine={hasDuplicatesInLine}
                scoreVibrate={scoreVibrate}
                currentScore={currentScore}
                timer={timer}
                formatTime={formatTime}
                formatScore={formatScore}
                handleNewRandomGame={handleNewRandomGame}
                handleHelpOpen={handleHelpOpen}
                setSettingsModalOpen={setSettingsModalOpen}
              />
            </div>
          </div>
        </div>
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

      <WinModal
        winModalOpen={winModalOpen}
        isNewHighScore={isNewHighScore}
        scoreBreakdown={scoreBreakdown}
        currentScore={currentScore}
        timer={timer}
        formatTime={formatTime}
        formatScore={formatScore}
        highScore={highScore}
        handleShareResult={handleShareResult}
        handleRestartDailyPuzzle={handleRestartDailyPuzzle}
        setWinModalOpen={setWinModalOpen}
      />

      <SettingsModal
        settingsModalOpen={settingsModalOpen}
        keyboardPosition={keyboardPosition}
        setKeyboardPosition={setKeyboardPosition}
        setSettingsModalOpen={setSettingsModalOpen}
      />

      <HelpModal
        helpModalOpen={helpModalOpen}
        helpPage={helpPage}
        helpPages={helpPages}
        handleHelpPageChange={handleHelpPageChange}
        handleHelpClose={handleHelpClose}
      />
    </div>
  );
};

export default App;
