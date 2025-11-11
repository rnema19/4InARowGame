import { ROWS, COLS, CONNECT_COUNT } from '../utils/constants.js';

export class BotService {
  constructor(difficulty = 'hard') {
    this.difficulty = difficulty;
    this.maxDepth = difficulty === 'hard' ? 6 : 4;
  }

  // Get best move for bot
  getBestMove(gameState) {
    const validMoves = gameState.getValidMoves();
    
    if (validMoves.length === 0) return null;

    // Check for immediate win
    for (const col of validMoves) {
      if (this.isWinningMove(gameState, col, 2)) {
        return col;
      }
    }

    // Check for blocking opponent's win
    for (const col of validMoves) {
      if (this.isWinningMove(gameState, col, 1)) {
        return col;
      }
    }

    // Use minimax for best strategic move
    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (const col of validMoves) {
      const tempBoard = this.cloneBoard(gameState.board);
      const row = this.simulateMove(tempBoard, col, 2);
      
      const score = this.minimax(tempBoard, this.maxDepth - 1, -Infinity, Infinity, false);
      
      // Undo move
      tempBoard[row][col] = 0;

      if (score > bestScore) {
        bestScore = score;
        bestMove = col;
      }
    }

    return bestMove;
  }

  // Minimax algorithm with alpha-beta pruning
  minimax(board, depth, alpha, beta, isMaximizing) {
    const winner = this.checkWinnerOnBoard(board);
    
    if (winner === 2) return 10000 - depth;
    if (winner === 1) return -10000 + depth;
    if (this.isBoardFull(board) || depth === 0) {
      return this.evaluateBoard(board);
    }

    const validMoves = this.getValidMovesOnBoard(board);

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const col of validMoves) {
        const row = this.simulateMove(board, col, 2);
        const score = this.minimax(board, depth - 1, alpha, beta, false);
        board[row][col] = 0; // Undo
        
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break; // Pruning
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const col of validMoves) {
        const row = this.simulateMove(board, col, 1);
        const score = this.minimax(board, depth - 1, alpha, beta, true);
        board[row][col] = 0; // Undo
        
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break; // Pruning
      }
      return minScore;
    }
  }

  // Evaluate board position
  evaluateBoard(board) {
    let score = 0;

    // Center column preference
    const centerCol = Math.floor(COLS / 2);
    for (let row = 0; row < ROWS; row++) {
      if (board[row][centerCol] === 2) score += 3;
      if (board[row][centerCol] === 1) score -= 3;
    }

    // Evaluate all possible windows
    score += this.evaluateWindows(board, 2) - this.evaluateWindows(board, 1);

    return score;
  }

  // Evaluate all 4-cell windows
  evaluateWindows(board, player) {
    let score = 0;

    // Horizontal windows
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col <= COLS - CONNECT_COUNT; col++) {
        const window = [board[row][col], board[row][col+1], board[row][col+2], board[row][col+3]];
        score += this.scoreWindow(window, player);
      }
    }

    // Vertical windows
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row <= ROWS - CONNECT_COUNT; row++) {
        const window = [board[row][col], board[row+1][col], board[row+2][col], board[row+3][col]];
        score += this.scoreWindow(window, player);
      }
    }

    // Diagonal windows (/)
    for (let row = 3; row < ROWS; row++) {
      for (let col = 0; col <= COLS - CONNECT_COUNT; col++) {
        const window = [board[row][col], board[row-1][col+1], board[row-2][col+2], board[row-3][col+3]];
        score += this.scoreWindow(window, player);
      }
    }

    // Diagonal windows (\)
    for (let row = 0; row <= ROWS - CONNECT_COUNT; row++) {
      for (let col = 0; col <= COLS - CONNECT_COUNT; col++) {
        const window = [board[row][col], board[row+1][col+1], board[row+2][col+2], board[row+3][col+3]];
        score += this.scoreWindow(window, player);
      }
    }

    return score;
  }

  // Score a 4-cell window
  scoreWindow(window, player) {
    const opponent = player === 1 ? 2 : 1;
    const playerCount = window.filter(cell => cell === player).length;
    const opponentCount = window.filter(cell => cell === opponent).length;
    const emptyCount = window.filter(cell => cell === 0).length;

    if (playerCount === 4) return 100;
    if (playerCount === 3 && emptyCount === 1) return 5;
    if (playerCount === 2 && emptyCount === 2) return 2;
    if (opponentCount === 3 && emptyCount === 1) return -4;

    return 0;
  }

  // Helper methods
  isWinningMove(gameState, column, player) {
    const tempBoard = this.cloneBoard(gameState.board);
    const row = this.simulateMove(tempBoard, column, player);
    if (row === -1) return false;
    
    return this.checkWinAtPosition(tempBoard, row, column, player);
  }

  simulateMove(board, column, player) {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][column] === 0) {
        board[row][column] = player;
        return row;
      }
    }
    return -1;
  }

  cloneBoard(board) {
    return board.map(row => [...row]);
  }

  getValidMovesOnBoard(board) {
    const moves = [];
    for (let col = 0; col < COLS; col++) {
      if (board[0][col] === 0) moves.push(col);
    }
    return moves;
  }

  isBoardFull(board) {
    return board[0].every(cell => cell !== 0);
  }

  checkWinnerOnBoard(board) {
    // Check all positions for winner
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const player = board[row][col];
        if (player !== 0) {
          if (this.checkWinAtPosition(board, row, col, player)) {
            return player;
          }
        }
      }
    }
    return null;
  }

  checkWinAtPosition(board, row, col, player) {
    // Check horizontal
    let count = 1;
    for (let c = col + 1; c < COLS && board[row][c] === player; c++) count++;
    for (let c = col - 1; c >= 0 && board[row][c] === player; c--) count++;
    if (count >= CONNECT_COUNT) return true;

    // Check vertical
    count = 1;
    for (let r = row + 1; r < ROWS && board[r][col] === player; r++) count++;
    for (let r = row - 1; r >= 0 && board[r][col] === player; r--) count++;
    if (count >= CONNECT_COUNT) return true;

    // Check diagonal /
    count = 1;
    for (let r = row + 1, c = col + 1; r < ROWS && c < COLS && board[r][c] === player; r++, c++) count++;
    for (let r = row - 1, c = col - 1; r >= 0 && c >= 0 && board[r][c] === player; r--, c--) count++;
    if (count >= CONNECT_COUNT) return true;

    // Check diagonal \
    count = 1;
    for (let r = row + 1, c = col - 1; r < ROWS && c >= 0 && board[r][c] === player; r++, c--) count++;
    for (let r = row - 1, c = col + 1; r >= 0 && c < COLS && board[r][c] === player; r--, c++) count++;
    if (count >= CONNECT_COUNT) return true;

    return false;
  }
}
