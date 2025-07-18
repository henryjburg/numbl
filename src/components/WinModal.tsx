import React from 'react';
import { createPortal } from 'react-dom';

interface WinModalProps {
  winModalOpen: boolean;
  isNewHighScore: boolean;
  scoreBreakdown: any;
  currentScore: number;
  timer: number;
  formatTime: (seconds: number) => string;
  formatScore: (score: number) => string;
  highScore: number;
  handleShareResult: () => void;
  handleRestartDailyPuzzle: () => void;
  setWinModalOpen: (open: boolean) => void;
}

const WinModal: React.FC<WinModalProps> = ({
  winModalOpen,
  isNewHighScore,
  scoreBreakdown,
  currentScore,
  timer,
  formatTime,
  formatScore,
  highScore,
  handleShareResult,
  handleRestartDailyPuzzle,
  setWinModalOpen,
}) => {
  if (!winModalOpen) return null;

  const modalContent = (
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
                        <span>+{formatScore(scoreBreakdown.timeBonus)}</span>
                      </div>
                    )}
                    {scoreBreakdown.firstTimeCorrectBonus > 0 && (
                      <div className="score-row">
                        <span>First-Time Correct:</span>
                        <span>
                          +{formatScore(scoreBreakdown.firstTimeCorrectBonus)}
                        </span>
                      </div>
                    )}
                    {scoreBreakdown.perfectAccuracyBonus > 0 && (
                      <div className="score-row">
                        <span>Perfect Accuracy:</span>
                        <span>
                          +{formatScore(scoreBreakdown.perfectAccuracyBonus)}
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
                            Difficulty:{' '}
                            {scoreBreakdown.difficultyMultiplier.toFixed(1)}x
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
          <button className="win-modal-btn primary" onClick={handleShareResult}>
            Share
          </button>
          <button
            className="win-modal-btn secondary"
            onClick={() => {
              setWinModalOpen(false);
              handleRestartDailyPuzzle();
            }}
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default WinModal;
