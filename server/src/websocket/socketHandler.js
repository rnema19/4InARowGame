import { WebSocketServer } from 'ws';
import { GameService } from '../services/gameService.js';

export class SocketHandler {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.gameService = new GameService();
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('🔌 New client connected');
      
      let playerId = null;
      let username = null;

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          switch (data.type) {
            case 'JOIN_MATCHMAKING':
              playerId = data.playerId || `player_${Date.now()}`;
              username = data.username;
              
              const matchResult = await this.gameService.joinMatchmaking(playerId, username, ws);
              
              // Store session with database player ID after joining
              if (matchResult.dbPlayerId) {
                this.gameService.playerSessions.set(playerId, {
                  ws,
                  playerId,
                  username,
                  dbPlayerId: matchResult.dbPlayerId
                });
              } else {
                this.gameService.playerSessions.set(playerId, {
                  ws,
                  playerId,
                  username
                });
              }
              
              if (matchResult.type === 'MATCHED') {
                const game = this.gameService.activeGames.get(matchResult.gameId);
                
                // Store gameId in both player sessions
                const player2Session = this.gameService.playerSessions.get(playerId);
                if (player2Session) {
                  player2Session.gameId = matchResult.gameId;
                }
                
                const player1Session = this.gameService.playerSessions.get(matchResult.player1SessionId);
                if (player1Session) {
                  player1Session.gameId = matchResult.gameId;
                }
                
                // Send to player 2 (the one who just joined)
                ws.send(JSON.stringify({
                  type: 'GAME_START',
                  gameId: matchResult.gameId,
                  opponent: matchResult.opponent,
                  yourPlayer: 2,
                  isBot: false,
                  gameState: game.toJSON()
                }));
                
                // Send to player 1 (the waiting player)
                const player1SessionId = matchResult.player1SessionId;
                const opponentSession = this.gameService.playerSessions.get(player1SessionId);
                if (opponentSession && opponentSession.ws) {
                  opponentSession.ws.send(JSON.stringify({
                    type: 'GAME_START',
                    gameId: matchResult.gameId,
                    opponent: username,
                    yourPlayer: 1,
                    isBot: false,
                    gameState: game.toJSON()
                  }));
                } else {
                  console.error('❌ Could not find opponent session:', player1SessionId);
                }
              } else if (matchResult.type === 'WAITING') {
                ws.send(JSON.stringify({
                  type: 'WAITING_FOR_OPPONENT',
                  message: 'Waiting for opponent... Bot will join in 10 seconds'
                }));
              } else if (matchResult.type === 'REJOIN') {
                const gameState = this.gameService.reconnectPlayer(playerId, ws);
                ws.send(JSON.stringify({
                  type: 'REJOIN_GAME',
                  gameId: matchResult.gameId,
                  gameState
                }));
              }
              break;
              
            case 'MAKE_MOVE':
              const playerSession = this.gameService.playerSessions.get(playerId);
              if (!playerSession || !playerSession.dbPlayerId) {
                ws.send(JSON.stringify({
                  type: 'ERROR',
                  message: 'Player session not found'
                }));
                break;
              }
              
              const moveResult = await this.gameService.makeMove(
                data.gameId,
                playerSession.dbPlayerId,
                data.column
              );
              
              ws.send(JSON.stringify({
                type: 'MOVE_SUCCESS',
                ...moveResult
              }));
              
              // Get game to find opponent (game still exists even if ended)
              const game = this.gameService.activeGames.get(data.gameId);
              
              if (game) {
                // For PvP games, send move to opponent
                if (!game.isBot) {
                  // Find opponent's session ID by comparing database IDs
                  const currentDbPlayerId = playerSession.dbPlayerId;
                  const opponentDbPlayerId = game.player1Id === currentDbPlayerId ? game.player2Id : game.player1Id;
                  
                  console.log('🔍 Looking for opponent - Current player DB ID:', currentDbPlayerId, 'Opponent DB ID:', opponentDbPlayerId);
                  
                  // Find the opponent's session by database ID
                  let opponentSessionId = null;
                  for (const [sessionId, session] of this.gameService.playerSessions.entries()) {
                    if (session.dbPlayerId === opponentDbPlayerId) {
                      opponentSessionId = sessionId;
                      break;
                    }
                  }
                  
                  if (opponentSessionId) {
                    const opponentSession = this.gameService.playerSessions.get(opponentSessionId);
                    if (opponentSession && opponentSession.ws) {
                      console.log('✅ Sending move to opponent session:', opponentSessionId);
                      opponentSession.ws.send(JSON.stringify({
                        type: 'OPPONENT_MOVE',
                        column: data.column,
                        position: moveResult.position,
                        gameState: moveResult.gameState,
                        result: moveResult.result
                      }));
                    } else {
                      console.log('⚠️  Opponent session found but WebSocket not available');
                    }
                  } else {
                    console.log('⚠️  Opponent session not found for database ID:', opponentDbPlayerId);
                    console.log('Available sessions:', Array.from(this.gameService.playerSessions.entries()).map(([id, sess]) => ({
                      sessionId: id,
                      dbPlayerId: sess.dbPlayerId,
                      username: sess.username
                    })));
                  }
                }
                // For bot games, trigger bot move if game is not over and it's bot's turn
                else if (game.isBot && !game.winner && !moveResult.result?.winner && game.currentPlayer === 2) {
                  console.log('🤖 Triggering bot move...');
                  // Add a small delay to make it more natural
                  setTimeout(async () => {
                    try {
                      await this.gameService.makeBotMove(data.gameId);
                    } catch (error) {
                      console.error('❌ Bot move error:', error);
                    }
                  }, 500);
                }
              }
              break;
              
            case 'GET_LEADERBOARD':
              const leaderboard = await this.gameService.getLeaderboard();
              ws.send(JSON.stringify({
                type: 'LEADERBOARD',
                data: leaderboard
              }));
              break;
              
            default:
              ws.send(JSON.stringify({ 
                type: 'ERROR', 
                message: 'Unknown message type' 
              }));
          }
        } catch (error) {
          console.error('❌ WebSocket error:', error);
          ws.send(JSON.stringify({ 
            type: 'ERROR', 
            message: error.message 
          }));
        }
      });

      ws.on('close', () => {
        console.log('🔌 Client disconnected');
        if (playerId) {
          this.gameService.handleDisconnect(playerId);
        }
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });
  }
}
