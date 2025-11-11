import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketMessage } from '@/types/game.types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 10000;

interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: WebSocketMessage) => void;
  ws: WebSocket | null;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    try {
      const websocket = new WebSocket(WS_URL);

      websocket.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      websocket.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Received:', message);
          setLastMessage(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      websocket.onerror = (error: Event) => {
        console.error('❌ WebSocket error:', error);
      };

      websocket.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const timeout = Math.min(
            BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
            MAX_RECONNECT_DELAY
          );
          console.log(`🔄 Reconnecting in ${timeout}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, timeout);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };

      setWs(websocket);
      return websocket;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const websocket = connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (websocket) {
        websocket.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('📤 Sending:', message);
      ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }, [ws]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    ws,
  };
};
