export type PlayerNumber = 1 | 2;
export type CellValue = 0 | 1 | 2;
export type Board = CellValue[][];
export type WinningCell = [number, number];

export interface GameState {
  gameId: string;
  player1Id: number;
  player2Id: number | null;
  currentPlayer: PlayerNumber;
  board: Board;
  isBot: boolean;
  winner: PlayerNumber | null;
  winningCells: WinningCell[];
  moveCount: number;
  lastMove: {
    row: number;
    column: number;
    player: PlayerNumber;
  } | null;
}

export interface Player {
  id: number;
  username: string;
  gamesPlayed: number;
  gamesWon: number;
}

export interface LeaderboardEntry {
  username: string;
  gamesPlayed: number;
  gamesWon: number;
}

export type GameStatus = 'username' | 'waiting' | 'playing';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface MoveResult {
  position: { row: number; column: number };
  gameState: GameState;
  result?: {
    winner: PlayerNumber | null;
    winnerId: number | null;
    winningCells: WinningCell[];
    isDraw: boolean;
  };
}
