import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import UsernameInput from './components/UsernameInput';
import WaitingRoom from './components/WaitingRoom';
import Board from './components/Board';
import GameInfo from './components/GameInfo';
import Leaderboard from './components/Leaderboard';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { 
  GameStatus, 
  Board as BoardType, 
  PlayerNumber, 
  WinningCell 
} from './types/game.types';

function App() {
  const { isConnected, lastMessage, sendMessage } = useWebSocket();
  
  // App state
  const [gameState, setGameState] = useState<GameStatus>('username');
  const [username, setUsername] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
  
  // Game state
  const [gameId, setGameId] = useState<string | null>(null);
  const [board, setBoard] = useState<BoardType>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerNumber>(1);
  const [yourPlayer, setYourPlayer] = useState<PlayerNumber | null>(null);
  const [opponent, setOpponent] = useState('');
  const [isBot, setIsBot] = useState(false);
  const [winner, setWinner] = useState<PlayerNumber | null>(null);
  const [winningCells, setWinningCells] = useState<WinningCell[]>([]);
  const [isDraw, setIsDraw] = useState(false);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'WAITING_FOR_OPPONENT':
        setGameState('waiting');
        toast.info("Waiting for opponent...", {
          description: "Bot will join in 10 seconds if no one joins",
        });
        break;

      case 'GAME_START':
        console.log('GAME_START received:', lastMessage);
        setGameState('playing');
        setGameId(lastMessage.gameId);
        setYourPlayer(lastMessage.yourPlayer);
        setOpponent(lastMessage.opponent || 'Bot');
        setIsBot(lastMessage.isBot || false);
        
        // Use gameState from server or initialize empty board
        if (lastMessage.gameState) {
          console.log('Setting board from gameState:', lastMessage.gameState);
          setBoard(lastMessage.gameState.board);
          setCurrentPlayer(lastMessage.gameState.currentPlayer);
        } else {
          console.log('Initializing empty board');
          setBoard(Array(6).fill(null).map(() => Array(7).fill(0)));
          setCurrentPlayer(1);
        }
        
        setWinner(null);
        setWinningCells([]);
        setIsDraw(false);
        
        toast.success("Game Started!", {
          description: `Playing against ${lastMessage.isBot ? 'Bot' : lastMessage.opponent}`,
        });
        break;

      case 'MOVE_SUCCESS':
      case 'OPPONENT_MOVE':
        console.log('Move received:', lastMessage.type, lastMessage);
        if (lastMessage.gameState) {
          setBoard(lastMessage.gameState.board);
          setCurrentPlayer(lastMessage.gameState.currentPlayer);
          
          if (lastMessage.result) {
            setWinner(lastMessage.result.winner);
            setWinningCells(lastMessage.result.winningCells || []);
            setIsDraw(lastMessage.result.isDraw);
            
            if (lastMessage.result.winner) {
              if (lastMessage.result.winner === yourPlayer) {
                toast.success("You Won! 🎉", {
                  description: "Congratulations!",
                });
              } else {
                toast.error("You Lost 😢", {
                  description: "Better luck next time!",
                });
              }
            } else if (lastMessage.result.isDraw) {
              toast.info("It's a Draw! 🤝", {
                description: "Well played!",
              });
            }
          }
        }
        break;

      case 'OPPONENT_DISCONNECTED':
      case 'GAME_FORFEITED':
        setWinner(lastMessage.winner || yourPlayer);
        setIsDraw(false);
        toast.success("You Win! 🎉", {
          description: lastMessage.message || "Opponent disconnected!",
        });
        break;

      case 'REJOIN_GAME':
        setGameState('playing');
        setGameId(lastMessage.gameId);
        if (lastMessage.gameState) {
          setBoard(lastMessage.gameState.board);
          setCurrentPlayer(lastMessage.gameState.currentPlayer);
          setYourPlayer(lastMessage.gameState.player1Id === playerId ? 1 : 2);
          setIsBot(lastMessage.gameState.isBot);
        }
        break;

      case 'ERROR':
        console.error('Game error:', lastMessage.message);
        toast.error("Error", {
          description: lastMessage.message,
        });
        break;

      default:
        break;
    }
  }, [lastMessage, playerId, yourPlayer, toast]);

  // Handle username submission
  const handleUsernameSubmit = useCallback((name: string) => {
    setUsername(name);
    const newPlayerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setPlayerId(newPlayerId);
    
    sendMessage({
      type: 'JOIN_MATCHMAKING',
      username: name,
      playerId: newPlayerId,
    });
  }, [sendMessage]);

  // Handle column click
  const handleColumnClick = useCallback((column: number) => {
    console.log('Column clicked:', column);
    console.log('gameId:', gameId, 'currentPlayer:', currentPlayer, 'yourPlayer:', yourPlayer, 'winner:', winner, 'isDraw:', isDraw);
    
    if (!gameId || currentPlayer !== yourPlayer || winner || isDraw) {
      console.log('Move blocked - conditions not met');
      return;
    }

    console.log('Sending MAKE_MOVE message');
    sendMessage({
      type: 'MAKE_MOVE',
      gameId,
      column,
    });
  }, [gameId, currentPlayer, yourPlayer, winner, isDraw, sendMessage]);

  // Handle play again
  const handlePlayAgain = useCallback(() => {
    console.log('Play Again clicked - Current playerId:', playerId, 'username:', username);
    
    setGameState('waiting');
    setGameId(null);
    setBoard([]);
    setCurrentPlayer(1);
    setYourPlayer(null);
    setOpponent('');
    setIsBot(false);
    setWinner(null);
    setWinningCells([]);
    setIsDraw(false);

    if (playerId && username) {
      console.log('Rejoining matchmaking with same playerId:', playerId);
      sendMessage({
        type: 'JOIN_MATCHMAKING',
        username,
        playerId,
      });
    } else {
      console.error('Missing playerId or username!');
    }
  }, [username, playerId, sendMessage]);

  // Handle exit game
  const handleExitGame = useCallback(() => {
    // Just disconnect - server will handle the forfeit
    setGameState('username');
    setGameId(null);
    setBoard([]);
    setCurrentPlayer(1);
    setYourPlayer(null);
    setOpponent('');
    setIsBot(false);
    setWinner(null);
    setWinningCells([]);
    setIsDraw(false);
    
    toast.info("Exited Game", {
      description: "You can rejoin if you were in a match",
    });
  }, [toast]);

  // Render based on game state
  const renderContent = () => {
    if (gameState === 'username') {
      return (
        <UsernameInput
          onSubmit={handleUsernameSubmit}
          isConnected={isConnected}
        />
      );
    }

    if (gameState === 'waiting') {
      return <WaitingRoom />;
    }

    if (gameState === 'playing' && yourPlayer) {
      const isMyTurn = currentPlayer === yourPlayer;
      const gameEnded = winner !== null || isDraw;

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            <GameInfo
              currentPlayer={currentPlayer}
              yourPlayer={yourPlayer}
              isMyTurn={isMyTurn}
              opponent={opponent}
              isBot={isBot}
              winner={winner}
              isDraw={isDraw}
              onExit={handleExitGame}
            />

            <div className="flex justify-center mb-6">
              <Board
                board={board}
                winningCells={winningCells}
                onColumnClick={handleColumnClick}
                isMyTurn={isMyTurn}
                gameEnded={gameEnded}
              />
            </div>

            {gameEnded && (
              <div className="text-center">
                <Button
                  onClick={handlePlayAgain}
                  size="lg"
                >
                  🔄 Play Again
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {renderContent()}
      {gameState !== 'username' && (
        <Leaderboard sendMessage={sendMessage} lastMessage={lastMessage} />
      )}
      <Toaster />
    </>
  );
}

export default App;
