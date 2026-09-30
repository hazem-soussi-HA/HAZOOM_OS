import { useEffect, useRef, useState } from 'react';
import { WebSocketMessage } from '../types';

export const useWebSocket = (onMessage: (message: WebSocketMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<any>();

  const connect = () => {
    // For demo purposes, we'll simulate WebSocket with mock data
    // In production, this would connect to: ws://localhost:8080/ws
    
    console.log('WebSocket connection simulated for demo');
    setIsConnected(true);

    // Simulate real-time updates every 369ms
    const interval = setInterval(() => {
      const mockMessage: WebSocketMessage = {
        type: 'metric',
        data: {
          metrics: {
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
            disk: Math.random() * 100,
            network: Math.random() * 1000,
            activeAgents: Math.floor(Math.random() * 20),
            totalTasks: Math.floor(Math.random() * 100),
            successRate: 90 + Math.random() * 10,
            avgResponseTime: Math.random() * 500
          }
        },
        timestamp: new Date()
      };
      onMessage(mockMessage);
    }, 369);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (cleanup) cleanup();
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      ws.current?.close();
    };
  }, [onMessage]);

  return { isConnected };
};