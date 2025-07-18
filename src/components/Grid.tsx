import React from 'react';

interface GridProps {
  board: string[][];
  selected: { row: number; col: number };
  feedback: string[][];
  arrowDirections: ('down' | 'right' | null)[][];
  duplicates: Set<string>;
  isPreFilledCell: (row: number, col: number) => boolean;
  isColumnFocus: boolean;
  handleCellClick: (row: number, col: number) => void;
}

const Grid: React.FC<GridProps> = ({
  board,
  selected,
  feedback,
  arrowDirections,
  duplicates,
  isPreFilledCell,
  isColumnFocus,
  handleCellClick,
}) => (
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
);

export default Grid;
