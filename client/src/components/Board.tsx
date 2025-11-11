import React from 'react';
import Cell from './Cell';
import { Board as BoardType, WinningCell } from '@/types/game.types';
import { Card } from '@/components/ui/card';

interface BoardProps {
  board: BoardType;
  winningCells: WinningCell[];
  onColumnClick: (column: number) => void;
  isMyTurn: boolean;
  gameEnded: boolean;
}

const Board: React.FC<BoardProps> = ({ 
  board, 
  winningCells, 
  onColumnClick, 
  isMyTurn, 
  gameEnded 
}) => {
  const isWinningCell = (row: number, col: number): boolean => {
    return winningCells?.some(([r, c]) => r === row && c === col) || false;
  };

  const handleColumnClick = (colIndex: number) => {
    if (!isMyTurn || gameEnded) return;
    onColumnClick(colIndex);
  };

  return (
    <Card className="inline-block bg-white/10 backdrop-blur-md p-6">
      <div className="bg-blue-800/50 p-4 rounded-lg">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                value={cell}
                isWinning={isWinningCell(rowIndex, colIndex)}
                onClick={() => handleColumnClick(colIndex)}
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default Board;
