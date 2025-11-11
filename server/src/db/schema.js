import { pgTable, serial, varchar, integer, timestamp, uuid, jsonb, boolean, index } from 'drizzle-orm/pg-core';

// Players table
export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  gamesPlayed: integer('games_played').default(0).notNull(),
  gamesWon: integer('games_won').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    usernameIdx: index('username_idx').on(table.username),
  };
});

// Games table
export const games = pgTable('games', {
  id: uuid('id').primaryKey(),
  player1Id: integer('player1_id').references(() => players.id).notNull(),
  player2Id: integer('player2_id').references(() => players.id),
  winnerId: integer('winner_id').references(() => players.id),
  gameState: jsonb('game_state').notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'waiting', 'active', 'completed', 'forfeited'
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  isBotGame: boolean('is_bot_game').default(false).notNull(),
}, (table) => {
  return {
    statusIdx: index('status_idx').on(table.status),
    player1Idx: index('player1_idx').on(table.player1Id),
    player2Idx: index('player2_idx').on(table.player2Id),
  };
});

// Game moves table
export const gameMoves = pgTable('game_moves', {
  id: serial('id').primaryKey(),
  gameId: uuid('game_id').references(() => games.id).notNull(),
  playerId: integer('player_id').references(() => players.id),
  columnIndex: integer('column_index').notNull(),
  moveNumber: integer('move_number').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => {
  return {
    gameIdIdx: index('game_id_idx').on(table.gameId),
  };
});
