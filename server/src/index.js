import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { SocketHandler } from './websocket/socketHandler.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Middleware
app.use(cors());
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
