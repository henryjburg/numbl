import React from 'react';
import { Constraint, FeedbackType } from '../types/puzzle';

interface ConstraintDisplayProps {
  selected: { row: number; col: number } | null;
  isColumnFocus: boolean;
  feedback: FeedbackType[][];
  puzzle: any;
  getConstraintName: (constraint: Constraint) => string;
  getConstraintValue: (constraint: Constraint) => string;
  getConstraintType: (constraint: Constraint) => string;
  isConstraintGuessedCorrect: (
    feedback: FeedbackType[][],
    lineType: 'row' | 'col',
    index: number
  ) => boolean;
  constraintTooltipVisible: boolean;
  constraintTooltipText: string;
  handleConstraintInfoShow: (
    event: React.MouseEvent,
    constraint: Constraint,
    lineType: 'row' | 'col'
  ) => void;
  handleConstraintInfoHide: () => void;
}

const ConstraintDisplay: React.FC<ConstraintDisplayProps> = ({
  selected,
  isColumnFocus,
  feedback,
  puzzle,
  getConstraintName,
  getConstraintValue,
  getConstraintType,
  isConstraintGuessedCorrect,
  constraintTooltipVisible,
  constraintTooltipText,
  handleConstraintInfoShow,
  handleConstraintInfoHide,
}) =>
  selected && (
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
          <div className="numbl-constraint-content">
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
          <button
            className="numbl-constraint-info-btn"
            onMouseEnter={e =>
              handleConstraintInfoShow(
                e,
                isColumnFocus
                  ? puzzle.colConstraints[selected.col]
                  : puzzle.rowConstraints[selected.row],
                isColumnFocus ? 'col' : 'row'
              )
            }
            onMouseLeave={handleConstraintInfoHide}
            onClick={e =>
              handleConstraintInfoShow(
                e,
                isColumnFocus
                  ? puzzle.colConstraints[selected.col]
                  : puzzle.rowConstraints[selected.row],
                isColumnFocus ? 'col' : 'row'
              )
            }
            aria-label="Constraint information"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="10"
                cy="10"
                r="8"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
              />
              <rect
                x="9"
                y="8"
                width="2"
                height="6"
                rx="1"
                fill="currentColor"
              />
              <circle cx="10" cy="6" r="1.2" fill="currentColor" />
            </svg>
            {constraintTooltipVisible && (
              <div className="numbl-constraint-tooltip">
                {constraintTooltipText}
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );

export default ConstraintDisplay;
