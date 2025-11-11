import React from 'react';
import { CellValue } from '@/types/game.types';
import { cn } from '@/lib/utils';

interface CellProps {
  value: CellValue;
  isWinning: boolean;
  onClick: () => void;
}

const Cell: React.FC<CellProps> = ({ value, isWinning, onClick }) => {
  const getCellColor = () => {
    if (value === 1) return 'bg-player-red';
    if (value === 2) return 'bg-player-yellow';
    return 'bg-gray-700/50';
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'w-16 h-16 rounded-full m-1 cursor-pointer transition-all duration-200',
        getCellColor(),
        isWinning && 'ring-4 ring-green-400 animate-pulse',
        value === 0 && 'hover:bg-gray-600/50',
        value !== 0 && 'shadow-lg'
      )}
    />
  );
};

export default Cell;
