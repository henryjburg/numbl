import React, { useState, useEffect } from 'react';
import '../styles/App.css';
import { Puzzle, FeedbackType } from '../types/puzzle';
import {
  getConstraintText,
  getConstraintType,
  isConstraintSatisfied,
  isConstraintGuessedCorrect,
  isPuzzleComplete,
  getDuplicates,
  hasDuplicatesInLine,
  generatePuzzleHash,
  emptyBoard
} from '../utils/puzzleUtils';
import { formatTime } from '../utils/timeUtils';
import { examplePuzzle } from '../data/examplePuzzle';
import { calculateScore, calculateRunningScore, formatScore } from '../utils/scoringUtils';
import { ScoreBreakdown, GameStats } from '../types/puzzle';

const App: React.FC = () => {
  const [board, setBoard] = useState<string[][]>(emptyBoard());
  const [selected, setSelected] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [feedback, setFeedback] = useState<FeedbackType[][]>(
    Array(4).fill(null).map(() => Array(4).fill('none'))
  );
  const [feedbackNumbers, setFeedbackNumbers] = useState<string[][]>(
    Array(4).fill(null).map(() => Array(4).fill(''))
  );
  const [timer, setTimer] = useState(0);
  const [active, setActive] = useState(true);
  const [pendingGuesses, setPendingGuesses] = useState<Array<{mode: 'row' | 'col', index: number}>>([]);
  const [puzzle, setPuzzle] = useState<Puzzle>(examplePuzzle);
  const [debugMode, setDebugMode] = useState(false);
  const [winModalOpen, setWinModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalGuesses: 0,
    correctGuesses: 0,
    wrongGuesses: 0,
    firstTimeCorrectRows: 0,
    firstTimeCorrectCols: 0,
    timeInSeconds: 0
  });
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [scoreVibrate, setScoreVibrate] = useState(false);
  const [guessedRows, setGuessedRows] = useState<Set<number>>(new Set());
  const [guessedCols, setGuessedCols] = useState<Set<number>>(new Set());
  const [isColumnFocus, setIsColumnFocus] = useState(false);
  const lastClickTime = React.useRef(0);
  const pressedKeys = React.useRef<Set<string>>(new Set());

  // Generate hash for current puzzle
  const currentHash = generatePuzzleHash(puzzle);

  // Track duplicates
  const duplicates = getDuplicates(board);

  // Timer
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => setTimer(t => {
      const newTime = t + 1;
      setGameStats(prev => ({ ...prev, timeInSeconds: newTime }));
      return newTime;
    }), 1000);
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

      // Number input (1-9, 0 for 10, a-f for 11-16)
      if (/^[1-9a-f]$/.test(key)) {
        if (selected) {
          // Don't allow input if the cell is already correct
          if (feedback[selected.row][selected.col] === 'correct' && board[selected.row][selected.col] === feedbackNumbers[selected.row][selected.col]) {
            return;
          }
          let num = key;
          if (key === '0') num = '10';
          else if (key === 'a') num = '11';
          else if (key === 'b') num = '12';
          else if (key === 'c') num = '13';
          else if (key === 'd') num = '14';
          else if (key === 'e') num = '15';
          else if (key === 'f') num = '16';
          handleNumberInput(num);
        }
        return;
      }

      // Backspace/Delete to clear cell and move left
      if ((key === 'Backspace' || key === 'Delete') && selected) {
        const { row, col } = selected;
        // Don't allow clearing numbers that are correct
        if (feedback[row][col] === 'correct' && board[row][col] === feedbackNumbers[row][col]) {
          return;
        }
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = '';
        setBoard(newBoard);

        // Move to left if available
        if (col > 0) {
          setSelected({ row, col: col - 1 });
        }

        // Re-check for guessing eligibility since we cleared a cell
        checkForGuessingEligibility(newBoard);
        return;
      }

      // Arrow key navigation
      if (selected) {
        switch (key) {
          case 'ArrowLeft':
            if (isColumnFocus) {
              // In column focus, move to previous row in same column
              if (selected.row > 0) {
                setSelected({ row: selected.row - 1, col: selected.col });
              }
            } else {
              // In row focus, move to previous column in same row
              if (selected.col > 0) {
                setSelected({ row: selected.row, col: selected.col - 1 });
              }
            }
            break;
          case 'ArrowRight':
            if (isColumnFocus) {
              // In column focus, move to next row in same column
              if (selected.row < 3) {
                setSelected({ row: selected.row + 1, col: selected.col });
              }
            } else {
              // In row focus, move to next column in same row
              if (selected.col < 3) {
                setSelected({ row: selected.row, col: selected.col + 1 });
              }
            }
            break;
          case 'ArrowUp':
            e.preventDefault();
            if (isColumnFocus) {
              // In column focus, move to previous row in same column
              if (selected.row > 0) {
                setSelected({ row: selected.row - 1, col: selected.col });
              }
            } else {
              // In row focus, move to previous row in same column
              if (selected.row > 0) {
                setSelected({ row: selected.row - 1, col: selected.col });
              }
            }
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (isColumnFocus) {
              // In column focus, move to next row in same column
              if (selected.row < 3) {
                setSelected({ row: selected.row + 1, col: selected.col });
              }
            } else {
              // In row focus, move to next row in same column
              if (selected.row < 3) {
                setSelected({ row: selected.row + 1, col: selected.col });
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
  }, [selected, active, pendingGuesses, board, feedback, puzzle.solution, debugMode, duplicates.size, isColumnFocus]);

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
  const checkForGuessingEligibility = (currentBoard: string[][], currentFeedback?: FeedbackType[][]) => {
    const feedbackToUse = currentFeedback || feedback;
    const newPendingGuesses: Array<{mode: 'row' | 'col', index: number}> = [];

    // Check all rows
    for (let row = 0; row < 4; row++) {
      if (currentBoard[row].every(cell => cell) && !isConstraintGuessedCorrect(feedbackToUse, 'row', row)) {
        // Only allow guessing if this row hasn't been guessed yet
        if (!guessedRows.has(row)) {
          newPendingGuesses.push({ mode: 'row', index: row });
        }
      }
    }

    // Check all columns
    for (let col = 0; col < 4; col++) {
      if (currentBoard.every(r => r[col]) && !isConstraintGuessedCorrect(feedbackToUse, 'col', col)) {
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
    // Don't allow changing numbers that are correct
    if (feedback[row][col] === 'correct' && board[row][col] === feedbackNumbers[row][col]) {
      return;
    }
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = num;
    setBoard(newBoard);

    // Clear feedback for this cell since the number changed
    const newFeedback = feedback.map(r => [...r]);
    const newFeedbackNumbers = feedbackNumbers.map(r => [...r]);
    newFeedback[row][col] = 'none';
    newFeedbackNumbers[row][col] = '';
    setFeedback(newFeedback);
    setFeedbackNumbers(newFeedbackNumbers);

    // Allow re-guessing this row and column since it was modified
    const newGuessedRows = new Set(guessedRows);
    const newGuessedCols = new Set(guessedCols);
    newGuessedRows.delete(row);
    newGuessedCols.delete(col);
    setGuessedRows(newGuessedRows);
    setGuessedCols(newGuessedCols);

    // Check all rows and columns for guessing eligibility
    checkForGuessingEligibility(newBoard);
  };

  // Handle guess
  const handleGuess = () => {
    if (pendingGuesses.length === 0) return;

    // Store previous feedback for first-time correct tracking
    const previousFeedback = feedback.map(r => [...r]);

    // Process all pending guesses at once
    const newFeedback = feedback.map(r => [...r]);
    const newFeedbackNumbers = feedbackNumbers.map(r => [...r]);

    let newCorrectGuesses = 0;
    let newWrongGuesses = 0;
    let newFirstTimeCorrectRows = 0;
    let newFirstTimeCorrectCols = 0;

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
              // Number exists in this row but wrong position - show as misplaced
              newFeedback[guess.index][c] = 'misplaced';
              newFeedbackNumbers[guess.index][c] = val;
              newCorrectGuesses++; // Correct number, wrong position
            } else {
              // Number exists in puzzle but not in this row - show as exists-elsewhere
              newFeedback[guess.index][c] = 'exists-elsewhere';
              newFeedbackNumbers[guess.index][c] = val;
              newCorrectGuesses++; // Exists in puzzle but not in this row
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
              // Number exists in this column but wrong position - show as misplaced
              newFeedback[r][guess.index] = 'misplaced';
              newFeedbackNumbers[r][guess.index] = val;
              newCorrectGuesses++; // Correct number, wrong position
            } else {
              // Number exists in puzzle but not in this column - show as exists-elsewhere
              newFeedback[r][guess.index] = 'exists-elsewhere';
              newFeedbackNumbers[r][guess.index] = val;
              newCorrectGuesses++; // Exists in puzzle but not in this column
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
      const line = guess.mode === 'row' ? newFeedback[guess.index] : newFeedback.map(row => row[guess.index]);
      const prevLine = guess.mode === 'row' ? previousFeedback[guess.index] : previousFeedback.map(row => row[guess.index]);

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

    setFeedback(newFeedback);
    setFeedbackNumbers(newFeedbackNumbers);

    // After processing guesses, check if there are any new eligible constraints
    checkForGuessingEligibility(board, newFeedback);

    // Update game stats with accurate counts
    setGameStats(prev => ({
      ...prev,
      totalGuesses: prev.totalGuesses + pendingGuesses.length,
      correctGuesses: prev.correctGuesses + newCorrectGuesses,
      wrongGuesses: prev.wrongGuesses + newWrongGuesses,
      firstTimeCorrectRows: prev.firstTimeCorrectRows + newFirstTimeCorrectRows,
      firstTimeCorrectCols: prev.firstTimeCorrectCols + newFirstTimeCorrectCols
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
    setBoard(emptyBoard());
    setFeedback(Array(4).fill(null).map(() => Array(4).fill('none')));
    setFeedbackNumbers(Array(4).fill(null).map(() => Array(4).fill('')));
    setTimer(0);
    setActive(true);
    setPuzzle(examplePuzzle); // In future, randomize
    setSelected({ row: 0, col: 0 });
    setPendingGuesses([]);
    setShowConfetti(false);
    setGameStats({
      totalGuesses: 0,
      correctGuesses: 0,
      wrongGuesses: 0,
      firstTimeCorrectRows: 0,
      firstTimeCorrectCols: 0,
      timeInSeconds: 0
    });
    setScoreBreakdown(null);
    setCurrentScore(0);
    setGuessedRows(new Set());
    setGuessedCols(new Set());
    setIsColumnFocus(false);
  };

  // Handle sharing result
  const handleShareResult = () => {
    const shareText = `I finished numbl ${currentHash.substring(0, 8)} in ${formatTime(timer)}!\n\nTry and beat me: https://numbl.net`;

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
    // Prevent selecting cells that are already correct
    if (feedback[row][col] === 'correct') {
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
        <h1>numbl</h1>
        <div className="numbl-stats">
          <div className="numbl-timer"><span className="emoji" role="img" aria-label="timer">⏰</span> {formatTime(timer)}</div>
          <div className={`numbl-score ${scoreVibrate ? 'vibrate' : ''}`}><span className="emoji" role="img" aria-label="trophy">🏆</span> {formatScore(currentScore)}</div>
        </div>
        <button className="numbl-new-btn" onClick={handleNewPuzzle}>New Puzzle</button>
      </div>
      <div className="numbl-constraints-container">
        {selected && (
          <div className="numbl-constraints-grid">
            <div className={`numbl-constraints-section ${!isColumnFocus ? 'focused' : ''}`} onClick={handleRowConstraintClick}>
              <h3>Row {selected.row + 1}</h3>
              <div className="numbl-constraints-list">
                <div className="numbl-constraint-item">
                  <span className={`numbl-constraint-text constraint-${getConstraintType(puzzle.rowConstraints[selected.row])} ${isConstraintGuessedCorrect(feedback, 'row', selected.row) ? 'guessed-correct' : ''}`}>
                    {getConstraintText(puzzle.rowConstraints[selected.row])}
                  </span>
                </div>
              </div>
            </div>
            <div className={`numbl-constraints-section ${isColumnFocus ? 'focused' : ''}`} onClick={handleColumnConstraintClick}>
              <h3>Column {selected.col + 1}</h3>
              <div className="numbl-constraints-list">
                <div className="numbl-constraint-item">
                  <span className={`numbl-constraint-text constraint-${getConstraintType(puzzle.colConstraints[selected.col])} ${isConstraintGuessedCorrect(feedback, 'col', selected.col) ? 'guessed-correct' : ''}`}>
                    {getConstraintText(puzzle.colConstraints[selected.col])}
                  </span>
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
                    className={`numbl-cell${selected && selected.row === rIdx && selected.col === cIdx ? ' selected' : ''} ${feedback[rIdx][cIdx] !== 'none' ? `feedback-${feedback[rIdx][cIdx]}` : ''} ${duplicates.has(`${rIdx},${cIdx}`) ? 'duplicate' : ''} ${feedback[rIdx][cIdx] === 'correct' ? 'locked' : ''} ${selected && ((!isColumnFocus && rIdx === selected.row) || (isColumnFocus && cIdx === selected.col)) ? 'focus-highlight' : ''}`}
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    // Only apply background via CSS classes now
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="numbl-puzzle-id">
          Puzzle: {currentHash.substring(0, 8)}
        </div>
      </div>
      <div className="numbl-inputs">
        {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(n => {
                    // Check if this number is correctly placed anywhere in the puzzle
          const isNumberCorrectlyPlaced = feedback.some((row, rowIndex) =>
            row.some((cellFeedback, colIndex) =>
              cellFeedback === 'correct' &&
              feedbackNumbers[rowIndex][colIndex] === String(n) &&
              board[rowIndex][colIndex] === String(n)
            )
          );

          return (
            <button
              key={n}
              className="numbl-num-btn"
              onClick={() => handleNumberInput(String(n))}
              disabled={!selected || isNumberCorrectlyPlaced}
            >
              {n}
            </button>
          );
        })}
      </div>
      <button
        className="numbl-guess-btn"
        onClick={handleGuess}
        disabled={pendingGuesses.length === 0 || pendingGuesses.some(guess => hasDuplicatesInLine(board, guess.mode, guess.index))}
      >
        Guess
      </button>

      <div className="numbl-credits">
        Made by <a href="https://github.com/henryjburg" target="_blank" rel="noopener noreferrer">@henryjburg</a>
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
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {winModalOpen && (
        <div className="win-modal">
          <div className="win-modal-content">
            <h2>numbl finished!</h2>
            <div className="time-display">{formatTime(timer)}</div>
            <div className="puzzle-id">Puzzle: {currentHash.substring(0, 8)}</div>
            {scoreBreakdown && (
              <div className="score-breakdown">
                <h3>Final Score: {formatScore(scoreBreakdown.totalScore)}</h3>
                <div className="score-details">
                  <div className="score-row">
                    <span>Base Score:</span>
                    <span>{formatScore(scoreBreakdown.baseScore)}</span>
                  </div>
                  {scoreBreakdown.timeBonus > 0 && (
                    <div className="score-row">
                      <span>Time Bonus:</span>
                      <span>+{formatScore(scoreBreakdown.timeBonus)}</span>
                    </div>
                  )}
                  {scoreBreakdown.firstTimeCorrectBonus > 0 && (
                    <div className="score-row">
                      <span>First-Time Correct:</span>
                      <span>+{formatScore(scoreBreakdown.firstTimeCorrectBonus)}</span>
                    </div>
                  )}
                  {scoreBreakdown.perfectAccuracyBonus > 0 && (
                    <div className="score-row">
                      <span>Perfect Accuracy:</span>
                      <span>+{formatScore(scoreBreakdown.perfectAccuracyBonus)}</span>
                    </div>
                  )}
                  {scoreBreakdown.efficiencyBonus > 0 && (
                    <div className="score-row">
                      <span>Efficiency Bonus:</span>
                      <span>+{formatScore(scoreBreakdown.efficiencyBonus)}</span>
                    </div>
                  )}
                  {(scoreBreakdown.timeMultiplier > 1.0 || scoreBreakdown.difficultyMultiplier > 1.0) && (
                    <div className="score-row multipliers">
                      <span>Multipliers:</span>
                      <span>
                        {scoreBreakdown.timeMultiplier > 1.0 && (
                          <span className="multiplier">Time: {scoreBreakdown.timeMultiplier}x</span>
                        )}
                        {scoreBreakdown.difficultyMultiplier > 1.0 && (
                          <span className="multiplier">Difficulty: {scoreBreakdown.difficultyMultiplier}x</span>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="score-row total">
                    <span>Total Score:</span>
                    <span>{formatScore(scoreBreakdown.totalScore)}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="win-modal-buttons">
              <button className="win-modal-btn primary" onClick={handleShareResult}>Share</button>
              <button className="win-modal-btn secondary" onClick={() => {
                setWinModalOpen(false);
                handleNewPuzzle();
              }}>Play Again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
