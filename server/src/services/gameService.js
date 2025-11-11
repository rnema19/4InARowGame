import { v4 as uuidv4 } from 'uuid';
import { eq, desc, gt, and, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { players, games, gameMoves } from '../db/schema.js';
import { GameState } from '../models/GameState.js';
import { BotService } from './botService.js';
import { KafkaService } from './kafkaService.js';
import { GAME_STATUS } from '../utils/constants.js';

export class GameService {
  constructor() {
    this.activeGames = new Map(); // gameId -> GameState
    this.waitingPlayers = new Map(); // playerId -> { username, timestamp, botTimeout }
    this.playerSessions = new Map(); // playerId -> { gameId, ws, reconnectTimeout }
    this.botService = new BotService('hard');
    this.kafkaService = new KafkaService();
  }

  // Player joins matchmaking
  async joinMatchmaking(playerId, username, ws) {
    const existingSession = this.playerSessions.get(playerId);
    if (existingSession && existingSession.gameId) {
      const game = this.activeGames.get(existingSession.gameId);
      // Only rejoin if game exists and hasn't ended
      if (game && !game.winner && !game.isDraw) {
        return { type: 'REJOIN', gameId: existingSession.gameId };
      }
      // Game ended, clear the old gameId
      delete existingSession.gameId;
    }

    const player = await this.getOrCreatePlayer(username);
    
    await this.kafkaService.emitEvent('player.matchmaking.joined', {
      playerId: player.id,
      username: player.username,
      timestamp: new Date().toISOString(),
    });
    
    const waitingPlayer = this.findWaitingPlayer(player.id);
    
    if (waitingPlayer) {
      // Clear the bot timeout for the waiting player
      if (waitingPlayer.botTimeout) {
        clearTimeout(waitingPlayer.botTimeout);
      }
      
      const gameId = await this.createGame(waitingPlayer.dbPlayerId, player.id, false);
      this.waitingPlayers.delete(waitingPlayer.dbPlayerId);
      
      await this.kafkaService.emitEvent('game.matched', {
        gameId,
        player1Id: waitingPlayer.dbPlayerId,
        player2Id: player.id,
        timestamp: new Date().toISOString(),
      });
      
      return { 
        type: 'MATCHED', 
        gameId, 
        opponent: waitingPlayer.username,
        player1SessionId: waitingPlayer.sessionId,
        dbPlayerId: player.id
      };
    } else {
      const botTimeout = setTimeout(() => {
        if (this.waitingPlayers.has(player.id)) {
          this.matchWithBot(playerId, player.id, username);
        }
      }, 10000);
      
      this.waitingPlayers.set(player.id, { 
        sessionId: playerId,
        dbPlayerId: player.id, 
        username, 
        timestamp: Date.now(),
        ws,
        botTimeout
      });
      
      return { type: 'WAITING', dbPlayerId: player.id };
    }
  }

  async matchWithBot(sessionId, dbPlayerId, username) {
    if (!this.waitingPlayers.has(dbPlayerId)) return;
    
    this.waitingPlayers.delete(dbPlayerId);
    const gameId = await this.createGame(dbPlayerId, null, true);
    
    await this.kafkaService.emitEvent('game.bot_matched', {
      gameId,
      playerId: dbPlayerId,
      timestamp: new Date().toISOString(),
    });
    
    const game = this.activeGames.get(gameId);
    const playerSession = this.playerSessions.get(sessionId);
    if (playerSession && playerSession.ws) {
      // Store gameId in session
      playerSession.gameId = gameId;
      
      playerSession.ws.send(JSON.stringify({
        type: 'GAME_START',
        gameId,
        opponent: 'Bot',
        yourPlayer: 1,
        isBot: true,
        gameState: game.toJSON()
      }));
    }
  }

  async createGame(player1Id, player2Id, isBot) {
    const gameId = uuidv4();
    const gameState = new GameState(gameId, player1Id, player2Id, isBot);
    
    this.activeGames.set(gameId, gameState);
    
    await db.insert(games).values({
      id: gameId,
      player1Id: player1Id,
      player2Id: player2Id,
      gameState: gameState.toJSON(),
      status: GAME_STATUS.ACTIVE,
      isBotGame: isBot,
    });
    
    await this.kafkaService.emitEvent('game.created', {
      gameId,
      player1Id,
      player2Id,
      isBot,
      timestamp: new Date().toISOString(),
    });
    
    return gameId;
  }

  async makeMove(gameId, playerId, column) {
    const game = this.activeGames.get(gameId);
    if (!game) throw new Error('Game not found');
    
    const playerNumber = game.player1Id === playerId ? 1 : 2;
    if (game.currentPlayer !== playerNumber) {
      throw new Error('Not your turn');
    }
    
    if (!game.isValidMove(column)) {
      throw new Error('Invalid move');
    }
    
    const position = game.dropDisc(column, playerNumber);
    
    await db.insert(gameMoves).values({
      gameId: gameId,
      playerId: playerId,
      columnIndex: column,
      moveNumber: game.moveCount,
    });
    
    await this.kafkaService.emitEvent('game.move', {
      gameId,
      playerId,
      playerNumber,
      column,
      position,
      moveNumber: game.moveCount,
      timestamp: new Date().toISOString(),
    });
    
    const hasWinner = game.checkWinner();
    const isDraw = game.isBoardFull();
    
    let result = null;
    if (hasWinner || isDraw) {
      result = await this.endGame(gameId, hasWinner ? game.winner : null);
    } else {
      game.switchPlayer();
      
      await db.update(games)
        .set({ gameState: game.toJSON() })
        .where(eq(games.id, gameId));
      
      if (game.isBot && game.currentPlayer === 2) {
        setTimeout(() => this.makeBotMove(gameId), 500);
      }
    }
    
    return {
      position,
      gameState: game.toJSON(),
      result
    };
  }

  async makeBotMove(gameId) {
    const game = this.activeGames.get(gameId);
    if (!game || !game.isBot) return;
    
    const column = this.botService.getBestMove(game);
    if (column === null) return;
    
    const position = game.dropDisc(column, 2);
    
    await db.insert(gameMoves).values({
      gameId: gameId,
      playerId: null,
      columnIndex: column,
      moveNumber: game.moveCount,
    });
    
    await this.kafkaService.emitEvent('game.bot_move', {
      gameId,
      column,
      position,
      moveNumber: game.moveCount,
      timestamp: new Date().toISOString(),
    });
    
    const hasWinner = game.checkWinner();
    const isDraw = game.isBoardFull();
    
    let result = null;
    if (hasWinner || isDraw) {
      result = await this.endGame(gameId, hasWinner ? game.winner : null);
    } else {
      game.switchPlayer();
      
      await db.update(games)
        .set({ gameState: game.toJSON() })
        .where(eq(games.id, gameId));
    }
    
    // Find the player's session by database ID
    let playerSessionId = null;
    for (const [sessionId, session] of this.playerSessions.entries()) {
      if (session.dbPlayerId === game.player1Id) {
        playerSessionId = sessionId;
        break;
      }
    }
    
    if (playerSessionId) {
      const playerSession = this.playerSessions.get(playerSessionId);
      if (playerSession && playerSession.ws) {
        playerSession.ws.send(JSON.stringify({
          type: 'OPPONENT_MOVE',
          column,
          position,
          gameState: game.toJSON(),
          result
        }));
      }
    } else {
      console.log('⚠️  Player session not found for bot game, database ID:', game.player1Id);
    }
  }

  async endGame(gameId, winner) {
    const game = this.activeGames.get(gameId);
    if (!game) return null;
    
    const winnerId = winner ? (winner === 1 ? game.player1Id : game.player2Id) : null;
    
    await db.update(games)
      .set({
        status: GAME_STATUS.COMPLETED,
        winnerId: winnerId,
        endedAt: new Date(),
        gameState: game.toJSON(),
      })
      .where(eq(games.id, gameId));
    
    if (winnerId) {
      await db.update(players)
        .set({
          gamesWon: sql`${players.gamesWon} + 1`,
          gamesPlayed: sql`${players.gamesPlayed} + 1`,
        })
        .where(eq(players.id, winnerId));
      
      const loserId = winnerId === game.player1Id ? game.player2Id : game.player1Id;
      if (loserId) {
        await db.update(players)
          .set({
            gamesPlayed: sql`${players.gamesPlayed} + 1`,
          })
          .where(eq(players.id, loserId));
      }
    } else {
      await db.update(players)
        .set({
          gamesPlayed: sql`${players.gamesPlayed} + 1`,
        })
        .where(eq(players.id, game.player1Id));
      
      if (game.player2Id) {
        await db.update(players)
          .set({
            gamesPlayed: sql`${players.gamesPlayed} + 1`,
          })
          .where(eq(players.id, game.player2Id));
      }
    }
    
    await this.kafkaService.emitEvent('game.ended', {
      gameId,
      winnerId,
      isDraw: !winner,
      totalMoves: game.moveCount,
      timestamp: new Date().toISOString(),
    });
    
    // DON'T remove game from active games immediately
    // Keep it so we can still find opponents to notify
    // Will be cleaned up when players disconnect or rejoin
    
    return {
      winner,
      winnerId,
      winningCells: game.winningCells,
      isDraw: !winner,
      gameEnded: true
    };
  }

  async getOrCreatePlayer(username) {
    const existingPlayers = await db.select()
      .from(players)
      .where(eq(players.username, username))
      .limit(1);
    
    if (existingPlayers.length > 0) {
      return existingPlayers[0];
    }
    
    const newPlayers = await db.insert(players)
      .values({ username })
      .returning();
    
    return newPlayers[0];
  }

  findWaitingPlayer(excludePlayerId) {
    for (const [playerId, playerData] of this.waitingPlayers.entries()) {
      if (playerId !== excludePlayerId) {
        return playerData;
      }
    }
    return null;
  }

  async getLeaderboard(limit = 10) {
    const leaderboard = await db.select({
      username: players.username,
      gamesPlayed: players.gamesPlayed,
      gamesWon: players.gamesWon,
    })
      .from(players)
      .where(gt(players.gamesPlayed, 0))
      .orderBy(desc(players.gamesWon), players.gamesPlayed)
      .limit(limit);
    
    return leaderboard;
  }

  handleDisconnect(playerId) {
    const session = this.playerSessions.get(playerId);
    if (!session || !session.gameId) return;
    
    const game = this.activeGames.get(session.gameId);
    // Only handle disconnect for active games (not ended)
    if (!game || game.winner) return;
    
    this.kafkaService.emitEvent('player.disconnected', {
      playerId,
      gameId: session.gameId,
      timestamp: new Date().toISOString(),
    });
    
    // Set a 30-second timeout to forfeit the game
    session.reconnectTimeout = setTimeout(async () => {
      const currentGame = this.activeGames.get(session.gameId);
      if (currentGame && !currentGame.winner) {
        // Determine winner (the opponent who didn't disconnect)
        const disconnectedDbPlayerId = session.dbPlayerId;
        const winner = currentGame.player1Id === disconnectedDbPlayerId ? 2 : 1;
        const winnerId = winner === 1 ? currentGame.player1Id : currentGame.player2Id;
        
        // Mark game as forfeited
        await db.update(games)
          .set({
            status: GAME_STATUS.FORFEITED,
            winnerId: winnerId,
            endedAt: new Date(),
            gameState: currentGame.toJSON(),
          })
          .where(eq(games.id, session.gameId));
        
        // Update winner stats
        await db.update(players)
          .set({
            gamesWon: sql`${players.gamesWon} + 1`,
            gamesPlayed: sql`${players.gamesPlayed} + 1`,
          })
          .where(eq(players.id, winnerId));
        
        // Update loser stats
        const loserId = disconnectedDbPlayerId;
        await db.update(players)
          .set({
            gamesPlayed: sql`${players.gamesPlayed} + 1`,
          })
          .where(eq(players.id, loserId));
        
        await this.kafkaService.emitEvent('game.forfeited', {
          gameId: session.gameId,
          forfeitedBy: disconnectedDbPlayerId,
          winnerId: winnerId,
          timestamp: new Date().toISOString(),
        });
        
        // Mark game as ended
        currentGame.winner = winner;
        currentGame.winningCells = [];
        
        // Find opponent's session and notify them
        const opponentDbPlayerId = winner === 1 ? currentGame.player1Id : currentGame.player2Id;
        let opponentSessionId = null;
        for (const [sessionId, sess] of this.playerSessions.entries()) {
          if (sess.dbPlayerId === opponentDbPlayerId && sessionId !== playerId) {
            opponentSessionId = sessionId;
            break;
          }
        }
        
        if (opponentSessionId) {
          const opponentSession = this.playerSessions.get(opponentSessionId);
          if (opponentSession && opponentSession.ws) {
            opponentSession.ws.send(JSON.stringify({
              type: 'GAME_FORFEITED',
              winner,
              message: 'Opponent disconnected. You win!'
            }));
          }
        }
      }
      
      // Don't delete the session - allow them to reconnect to see result
    }, 30000);
  }

  reconnectPlayer(playerId, ws) {
    const session = this.playerSessions.get(playerId);
    if (!session) return null;
    
    if (session.reconnectTimeout) {
      clearTimeout(session.reconnectTimeout);
      session.reconnectTimeout = null;
    }
    
    session.ws = ws;
    
    this.kafkaService.emitEvent('player.reconnected', {
      playerId,
      gameId: session.gameId,
      timestamp: new Date().toISOString(),
    });
    
    const game = this.activeGames.get(session.gameId);
    return game ? game.toJSON() : null;
  }
}
