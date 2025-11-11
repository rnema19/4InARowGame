import React, { useEffect, useState } from 'react';
import { Card, CardContent} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, X, RefreshCw } from 'lucide-react';
import { LeaderboardEntry, WebSocketMessage } from '@/types/game.types';

interface LeaderboardProps {
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ sendMessage, lastMessage }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (lastMessage?.type === 'LEADERBOARD') {
      setLeaderboard(lastMessage.data);
    }
  }, [lastMessage]);

  const fetchLeaderboard = () => {
    sendMessage({ type: 'GET_LEADERBOARD' });
    setIsVisible(true);
  };

  if (!isVisible) {
    return (
      <Button
        onClick={fetchLeaderboard}
        className="fixed top-4 right-4"
        variant="secondary"
      >
        <Trophy className="mr-2 h-4 w-4" />
        Leaderboard
      </Button>
    );
  }

  return (
    <div className="fixed top-0 right-0 w-80 h-full bg-gray-900/95 backdrop-blur-md shadow-2xl p-6 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-400" />
          Leaderboard
        </h2>
        <Button
          onClick={() => setIsVisible(false)}
          variant="ghost"
          size="icon"
          className="text-white hover:text-gray-300"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {leaderboard.length === 0 ? (
        <p className="text-gray-400 text-center">No players yet</p>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((player, index) => (
            <Card
              key={player.username}
              className="bg-white/10 border-white/20"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-yellow-400">
                      #{index + 1}
                    </span>
                    <span className="text-white font-semibold">
                      {player.username}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    Wins: <span className="text-green-400 font-bold">{player.gamesWon}</span>
                  </span>
                  <span className="text-gray-400">
                    Played: <span className="text-blue-400 font-bold">{player.gamesPlayed}</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button
        onClick={fetchLeaderboard}
        className="w-full mt-6"
        variant="default"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh
      </Button>
    </div>
  );
};

export default Leaderboard;
