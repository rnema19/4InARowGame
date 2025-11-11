import { ROWS, COLS, CONNECT_COUNT } from '../utils/constants.js';

export class GameState {
  constructor(gameId, player1Id, player2Id = null, isBot = false) {
    this.gameId = gameId;
    this.player1Id = player1Id;
    this.player2Id = player2Id;
    this.currentPlayer = 1; // 1 or 2
    this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    this.isBot = isBot;
    this.winner = null;
    this.winningCells = [];
    this.moveCount = 0;
    this.lastMove = null;
  }

  // Drop a disc in the specified column
  dropDisc(column, player) {
    if (column < 0 || column >= COLS) {
      throw new Error('Invalid column');
    }

    // Find the lowest available row in the column
    for (let row = ROWS - 1; row >= 0; row--) {
      if (this.board[row][column] === 0) {
        this.board[row][column] = player;
        this.lastMove = { row, column, player };
        this.moveCount++;
        return { row, column };
      }
    }

    throw new Error('Column is full');
  }

  // Check if a column has space
  isValidMove(column) {
    return column >= 0 && column < COLS && this.board[0][column] === 0;
  }

  // Get all valid moves
  getValidMoves() {
    const moves = [];
    for (let col = 0; col < COLS; col++) {
      if (this.isValidMove(col)) {
        moves.push(col);
      }
    }
    return moves;
  }

  // Check for winner after a move
  checkWinner() {
    const { row, column, player } = this.lastMove;

    // Check horizontal
    const horizontal = this.checkDirection(row, column, 0, 1, player);
    if (horizontal.length >= CONNECT_COUNT) {
      this.winner = player;
      this.winningCells = horizontal;
      return true;
    }

    // Check vertical
    const vertical = this.checkDirection(row, column, 1, 0, player);
    if (vertical.length >= CONNECT_COUNT) {
      this.winner = player;
      this.winningCells = vertical;
      return true;
    }

    // Check diagonal (/)
    const diagonal1 = this.checkDirection(row, column, 1, 1, player);
    if (diagonal1.length >= CONNECT_COUNT) {
      this.winner = player;
      this.winningCells = diagonal1;
      return true;
    }

    // Check diagonal (\)
    const diagonal2 = this.checkDirection(row, column, 1, -1, player);
    if (diagonal2.length >= CONNECT_COUNT) {
      this.winner = player;
      this.winningCells = diagonal2;
      return true;
    }

    return false;
  }

  // Helper to check in a specific direction
  checkDirection(row, col, dRow, dCol, player) {
    const cells = [[row, col]];

    // Check forward
    let r = row + dRow;
    let c = col + dCol;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && this.board[r][c] === player) {
      cells.push([r, c]);
      r += dRow;
      c += dCol;
    }

    // Check backward
    r = row - dRow;
    c = col - dCol;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && this.board[r][c] === player) {
      cells.unshift([r, c]);
      r -= dRow;
      c -= dCol;
    }

    return cells;
  }

  // Check if board is full (draw)
  isBoardFull() {
    return this.board[0].every(cell => cell !== 0);
  }

  // Switch turn
  switchPlayer() {
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
  }

  // Get game state as JSON
  toJSON() {
    return {
      gameId: this.gameId,
      player1Id: this.player1Id,
      player2Id: this.player2Id,
      currentPlayer: this.currentPlayer,
      board: this.board,
      isBot: this.isBot,
      winner: this.winner,
      winningCells: this.winningCells,
      moveCount: this.moveCount,
      lastMove: this.lastMove
    };
  }

  // Create from JSON
  static fromJSON(data) {
    const game = new GameState(data.gameId, data.player1Id, data.player2Id, data.isBot);
    game.currentPlayer = data.currentPlayer;
    game.board = data.board;
    game.winner = data.winner;
    game.winningCells = data.winningCells;
    game.moveCount = data.moveCount;
    game.lastMove = data.lastMove;
    return game;
  }
}
