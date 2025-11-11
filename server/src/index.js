import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { SocketHandler } from './websocket/socketHandler.js';

dotenv.config();

const app = express();
const server = createServer(app);

// CORS Configuration
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://4-in-a-row-game-nine.vercel.app',
  /\.vercel\.app$/ // Allow all Vercel preview deployments
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches regex
    const isAllowed = ALLOWED_ORIGINS.some(allowed => 
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    );
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Connected (Drizzle ORM + Supabase)'
  });
});

// Initialize WebSocket
const socketHandler = new SocketHandler(server);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await socketHandler.gameService.kafkaService.disconnect();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🎮 WebSocket ready for connections`);
  console.log(`🗄️  Database: Supabase + Drizzle ORM`);
});
