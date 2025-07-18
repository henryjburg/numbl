import React from 'react';

interface KeyboardProps {
  keyboardPosition: 'left' | 'right';
  handleNumberInput: (num: string) => void;
  handleGuess: () => void;
  pendingGuesses: Array<{ mode: 'row' | 'col'; index: number }>;
  duplicates: Set<string>;
  board: string[][];
  hasDuplicatesInLine: (
    board: string[][],
    mode: 'row' | 'col',
    index: number
  ) => boolean;
  scoreVibrate: boolean;
  currentScore: number;
  timer: number;
  formatTime: (seconds: number) => string;
  formatScore: (score: number) => string;
  handleNewRandomGame: () => void;
  handleHelpOpen: () => void;
  setSettingsModalOpen: (open: boolean) => void;
}

const Keyboard: React.FC<KeyboardProps> = ({
  keyboardPosition,
  handleNumberInput,
  handleGuess,
  pendingGuesses,
  duplicates,
  board,
  hasDuplicatesInLine,
  scoreVibrate,
  currentScore,
  timer,
  formatTime,
  formatScore,
  handleNewRandomGame,
  handleHelpOpen,
  setSettingsModalOpen,
}) =>
  keyboardPosition === 'left' ? (
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
        <button className="numbl-new-game-btn" onClick={handleNewRandomGame}>
          New Game
        </button>
        <div className="numbl-utility-buttons">
          <button className="numbl-settings-btn" onClick={handleHelpOpen}>
            How to Play
          </button>
          <button
            className="numbl-settings-icon-btn"
            onClick={() => setSettingsModalOpen(true)}
            aria-label="Settings"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="6" r="2" fill="currentColor" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <circle cx="12" cy="18" r="2" fill="currentColor" />
            </svg>
          </button>
        </div>
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
        <button className="numbl-new-game-btn" onClick={handleNewRandomGame}>
          New Game
        </button>
        <div className="numbl-utility-buttons">
          <button className="numbl-settings-btn" onClick={handleHelpOpen}>
            How to Play
          </button>
          <button
            className="numbl-settings-icon-btn"
            onClick={() => setSettingsModalOpen(true)}
            aria-label="Settings"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="6" r="2" fill="currentColor" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <circle cx="12" cy="18" r="2" fill="currentColor" />
            </svg>
          </button>
        </div>
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
  );

export default Keyboard;
