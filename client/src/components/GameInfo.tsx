import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayerNumber } from '@/types/game.types';
import { LogOut } from 'lucide-react';

interface GameInfoProps {
  currentPlayer: PlayerNumber;
  yourPlayer: PlayerNumber;
  isMyTurn: boolean;
  opponent: string;
  isBot: boolean;
  winner: PlayerNumber | null;
  isDraw: boolean;
  onExit?: () => void;
}

const GameInfo: React.FC<GameInfoProps> = ({
  currentPlayer,
  yourPlayer,
  isMyTurn,
  opponent,
  isBot,
  winner,
  isDraw,
  onExit,
}) => {
  const getStatusMessage = () => {
    if (winner) {
      if (winner === yourPlayer) {
        return '🎉 You Won!';
      } else {
        return '😢 You Lost';
      }
    }
    
    if (isDraw) {
      return '🤝 It\'s a Draw!';
    }
    
    if (isMyTurn) {
      return '🎮 Your Turn';
    } else {
      return `⏳ ${isBot ? 'Bot' : 'Opponent'}\'s Turn`;
    }
  };

  return (
    <Card className="text-center mb-6 bg-white/10 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-white">
          {getStatusMessage()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around items-center">
          <div className="text-center">
            <div className={`w-12 h-12 rounded-full mx-auto mb-2 ${
              yourPlayer === 1 ? 'bg-player-red' : 'bg-player-yellow'
            }`} />
            <p className="text-white font-semibold">You</p>
            {currentPlayer === yourPlayer && (
              <p className="text-green-400 text-sm mt-1">● Active</p>
            )}
          </div>
          
          <div className="text-white text-2xl font-bold">VS</div>
          
          <div className="text-center">
            <div className={`w-12 h-12 rounded-full mx-auto mb-2 ${
              yourPlayer === 1 ? 'bg-player-yellow' : 'bg-player-red'
            }`} />
            <p className="text-white font-semibold">
              {isBot ? '🤖 Bot' : opponent || 'Opponent'}
            </p>
            {currentPlayer !== yourPlayer && (
              <p className="text-green-400 text-sm mt-1">● Active</p>
            )}
          </div>
        </div>
        
        {!winner && !isDraw && onExit && (
          <div className="mt-4">
            <Button 
              onClick={onExit}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Exit Game
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GameInfo;
