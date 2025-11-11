# 4-in-a-Row Multiplayer Game

A real-time multiplayer Connect Four game built with Node.js (JavaScript), React (TypeScript), WebSocket, Drizzle ORM, Supabase, and Kafka analytics.

## 🎮 Features

- **Real-time 1v1 Multiplayer** - Play against other players online
- **Smart Bot Opponent** - AI bot with Minimax algorithm (alpha-beta pruning)
- **Auto-matchmaking** - If no opponent joins in 10 seconds, bot takes over
- **Player Reconnection** - 30-second grace period to reconnect if disconnected
- **Live Leaderboard** - Track wins and games played
- **Game Analytics** - Kafka event streaming for game analytics
- **Responsive UI** - Built with shadcn/ui components and TailwindCSS

## 🏗️ Tech Stack

### Backend (JavaScript)
- Node.js + Express
- WebSocket (ws library)
- Drizzle ORM
- PostgreSQL (Supabase)
- Kafka for analytics
- UUID for game IDs

### Frontend (TypeScript)
- React 18
- TypeScript
- Vite
- shadcn/ui components
- TailwindCSS
- Lucide icons

## 📦 Project Structure

```
Emitrr/
├── server/              # Backend (JavaScript)
│   ├── src/
│   │   ├── db/         # Drizzle ORM schema & connection
│   │   ├── models/     # Game state model
│   │   ├── services/   # Game, Bot, Kafka services
│   │   ├── websocket/  # WebSocket handler
│   │   ├── utils/      # Constants & utilities
│   │   └── index.js    # Main server file
│   └── package.json
│
└── client/             # Frontend (TypeScript)
    ├── src/
    │   ├── components/ # React components
    │   ├── hooks/      # Custom hooks (WebSocket)
    │   ├── types/      # TypeScript types
    │   ├── lib/        # Utilities
    │   ├── App.tsx     # Main app component
    │   └── main.tsx    # Entry point
    └── package.json
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Supabase account recommended)
- Kafka broker (optional, for analytics)

### 1. Setup Supabase Database

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get your connection details:
   - Database URL from Settings > Database
   - Service key from Settings > API

### 2. Setup Backend

```powershell
cd server

# Install dependencies
npm install

# Create .env file from example
copy .env.example .env

# Edit .env with your Supabase credentials
# Update these values:
# DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_KEY=your-service-key

# Generate and push database schema
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

Server will run on `http://localhost:3001`

### 3. Setup Frontend

```powershell
cd client

# Install dependencies
npm install

# Install shadcn/ui components
npx shadcn-ui@latest init

# When prompted, use these settings:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
# - Path aliases: @/*

# Install required shadcn components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add sonner

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📍 **shadcn/ui Component Installation Directory**

Install shadcn/ui components in:
```
client/src/components/ui/
```

This directory should be created automatically during `npx shadcn-ui@latest init`.

Required components to install:
- `button` - For action buttons
- `card` - For game board and info cards
- `input` - For username input
- `label` - For form labels
- `sonner` - For toast notifications

## 🎯 How to Play

1. **Enter Username** - Enter a username (3-20 characters)
2. **Wait for Match** - System finds an opponent or matches you with bot after 10s
3. **Play Game** - Click columns to drop discs
4. **Win Condition** - Connect 4 discs horizontally, vertically, or diagonally
5. **View Leaderboard** - Click the leaderboard button to see top players

## 🤖 Bot AI

The bot uses a **Minimax algorithm with alpha-beta pruning**:
- Depth 6 search for hard difficulty
- Evaluates board positions strategically
- Prioritizes:
  1. Winning moves
  2. Blocking opponent wins
  3. Center column control
  4. Creating multiple win opportunities

## 📊 Game Analytics (Kafka)

Analytics events tracked:
- `player.matchmaking.joined`
- `game.matched` / `game.bot_matched`
- `game.created`
- `game.move` / `game.bot_move`
- `game.ended` / `game.forfeited`
- `player.disconnected` / `player.reconnected`

### Optional: Setup Kafka

```powershell
# Using Docker
docker run -p 9092:9092 apache/kafka:latest
```

If Kafka is not running, the server will continue without analytics in development mode.

## 🔧 Environment Variables

### Server (.env)
```env
PORT=3001
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=4inarow-game
NODE_ENV=development
```

## 🧪 Testing

```powershell
# Backend
cd server
npm run dev

# Frontend
cd client
npm run dev
```

Open multiple browser windows to test multiplayer functionality.

## 📝 Available Scripts

### Server
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run db:generate` - Generate Drizzle schema
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio

### Client
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🌐 API Endpoints

### WebSocket (ws://localhost:3001)

**Client → Server:**
- `JOIN_MATCHMAKING` - Join matchmaking queue
- `MAKE_MOVE` - Make a move in game
- `GET_LEADERBOARD` - Request leaderboard data

**Server → Client:**
- `WAITING_FOR_OPPONENT` - Waiting in queue
- `GAME_START` - Game has started
- `MOVE_SUCCESS` - Your move was successful
- `OPPONENT_MOVE` - Opponent made a move
- `OPPONENT_DISCONNECTED` - Opponent left
- `LEADERBOARD` - Leaderboard data
- `ERROR` - Error message

### HTTP Endpoints

- `GET /health` - Health check endpoint

## 🐛 Troubleshooting

**WebSocket connection fails:**
- Ensure backend server is running on port 3001
- Check firewall settings

**Database connection errors:**
- Verify DATABASE_URL in .env
- Check Supabase project is active
- Ensure IP is whitelisted in Supabase

**shadcn components not found:**
- Run `npx shadcn-ui@latest init` first
- Install required components individually
- Check `client/src/components/ui/` directory exists

**TypeScript errors:**
- Run `npm install` in client directory
- Ensure all shadcn components are installed
- Check tsconfig.json path aliases

## 📚 Learn More

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Vite Documentation](https://vitejs.dev/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 📄 License

MIT

## 👨‍💻 Author

Built for Emitrr Internship Assignment
