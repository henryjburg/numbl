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

  // Generate hash for current puzzle
  const currentHash = generatePuzzleHash(puzzle);

  // Track duplicates
  const duplicates = getDuplicates(board);

  // Timer
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [active]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!active) return;

      const key = e.key;

      // Debug mode toggle (Ctrl+D)
      if (key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setDebugMode(prev => !prev);
        return;
      }

      // Number input (1-9)
      if (/^[1-9]$/.test(key)) {
        if (selected) {
          handleNumberInput(key);
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
            if (selected.col > 0) {
              setSelected({ row: selected.row, col: selected.col - 1 });
            }
            break;
          case 'ArrowRight':
            if (selected.col < 3) {
              setSelected({ row: selected.row, col: selected.col + 1 });
            }
            break;
          case 'ArrowUp':
            e.preventDefault();
            if (selected.row > 0) {
              setSelected({ row: selected.row - 1, col: selected.col });
            }
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (selected.row < 3) {
              setSelected({ row: selected.row + 1, col: selected.col });
            }
            break;
        }
      }

      // Enter key to guess
      if (key === 'Enter' && pendingGuesses.length > 0) {
        handleGuess();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, active, pendingGuesses, board, feedback, puzzle.solution, debugMode, duplicates.size]);

  // Check for guessing eligibility whenever board changes
  useEffect(() => {
    checkForGuessingEligibility(board);
  }, [board, feedback]);

  // Handle puzzle completion
  useEffect(() => {
    if (active && isPuzzleComplete(feedback)) {
      setActive(false);
      setWinModalOpen(true);
      setShowConfetti(true);

      // Hide confetti after animation completes
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
    }
  }, [feedback, active]);

  // Check all rows and columns for guessing eligibility
  const checkForGuessingEligibility = (currentBoard: string[][], currentFeedback?: FeedbackType[][]) => {
    const feedbackToUse = currentFeedback || feedback;
    const newPendingGuesses: Array<{mode: 'row' | 'col', index: number}> = [];

    // Check all rows
    for (let row = 0; row < 4; row++) {
      if (currentBoard[row].every(cell => cell) && !isConstraintGuessedCorrect(feedbackToUse, 'row', row)) {
        newPendingGuesses.push({ mode: 'row', index: row });
      }
    }

    // Check all columns
    for (let col = 0; col < 4; col++) {
      if (currentBoard.every(r => r[col]) && !isConstraintGuessedCorrect(feedbackToUse, 'col', col)) {
        newPendingGuesses.push({ mode: 'col', index: col });
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

    // Check all rows and columns for guessing eligibility
    checkForGuessingEligibility(newBoard);
  };

  // Handle guess
  const handleGuess = () => {
    if (pendingGuesses.length === 0) return;

    // Process all pending guesses at once
    const newFeedback = feedback.map(r => [...r]);
    const newFeedbackNumbers = feedbackNumbers.map(r => [...r]);

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
          } else if (puzzle.solution[guess.index].includes(Number(val))) {
            newFeedback[guess.index][c] = 'misplaced';
            newFeedbackNumbers[guess.index][c] = val;
          } else {
            newFeedback[guess.index][c] = 'wrong';
            newFeedbackNumbers[guess.index][c] = val;
          }
        }
      } else if (guess.mode === 'col') {
        for (let r = 0; r < 4; r++) {
          const val = board[r][guess.index];
          if (val === String(puzzle.solution[r][guess.index])) {
            newFeedback[r][guess.index] = 'correct';
            newFeedbackNumbers[r][guess.index] = val;
          } else if (puzzle.solution.map(row => row[guess.index]).includes(Number(val))) {
            newFeedback[r][guess.index] = 'misplaced';
            newFeedbackNumbers[r][guess.index] = val;
          } else {
            newFeedback[r][guess.index] = 'wrong';
            newFeedbackNumbers[r][guess.index] = val;
          }
        }
      }
    }

    setFeedback(newFeedback);
    setFeedbackNumbers(newFeedbackNumbers);

    // After processing guesses, check if there are any new eligible constraints
    checkForGuessingEligibility(board, newFeedback);
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
    setSelected({ row, col });
    // Re-check for guessing eligibility when selecting a different cell
    checkForGuessingEligibility(board);
  };

  // Render
  return (
    <div className="numbl-root">
      <div className="numbl-header">
        <h1>numbl</h1>
        <div className="numbl-timer">⏱ {formatTime(timer)}</div>
        <button className="numbl-new-btn" onClick={handleNewPuzzle}>New Puzzle</button>
      </div>
      <div className="numbl-constraints-container">
        {selected && (
          <div className="numbl-constraints-grid">
            <div className="numbl-constraints-section">
              <h3>Row {selected.row + 1}</h3>
              <div className="numbl-constraints-list">
                <div className="numbl-constraint-item">
                  <span className={`numbl-constraint-text constraint-${getConstraintType(puzzle.rowConstraints[selected.row])} ${isConstraintGuessedCorrect(feedback, 'row', selected.row) ? 'guessed-correct' : isConstraintSatisfied(puzzle, board, puzzle.rowConstraints[selected.row], 'row', selected.row) ? 'met' : ''}`}>
                    {getConstraintText(puzzle.rowConstraints[selected.row])}
                  </span>
                </div>
              </div>
            </div>
            <div className="numbl-constraints-section">
              <h3>Column {selected.col + 1}</h3>
              <div className="numbl-constraints-list">
                <div className="numbl-constraint-item">
                  <span className={`numbl-constraint-text constraint-${getConstraintType(puzzle.colConstraints[selected.col])} ${isConstraintGuessedCorrect(feedback, 'col', selected.col) ? 'guessed-correct' : isConstraintSatisfied(puzzle, board, puzzle.colConstraints[selected.col], 'col', selected.col) ? 'met' : ''}`}>
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
                    className={`numbl-cell${selected && selected.row === rIdx && selected.col === cIdx ? ' selected' : ''} ${feedback[rIdx][cIdx] !== 'none' ? `feedback-${feedback[rIdx][cIdx]}` : ''} ${duplicates.has(`${rIdx},${cIdx}`) ? 'duplicate' : ''} ${feedback[rIdx][cIdx] === 'correct' ? 'locked' : ''}`}
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
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button
            key={n}
            className="numbl-num-btn"
            onClick={() => handleNumberInput(String(n))}
            disabled={!selected || (selected && feedback[selected.row][selected.col] === 'correct')}
          >
            {n}
          </button>
        ))}
      </div>
      <button
        className="numbl-guess-btn"
        onClick={handleGuess}
        disabled={pendingGuesses.length === 0 || pendingGuesses.some(guess => hasDuplicatesInLine(board, guess.mode, guess.index))}
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
