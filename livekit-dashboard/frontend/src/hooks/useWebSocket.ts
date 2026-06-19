import { useEffect, useRef, useState } from 'react';
import { createWebSocket } from '../api/client';

export function useWebSocket<T>(path: string, onMessage?: (data: T) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<T | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let mounted = true;

    function connect() {
      if (!mounted) return;

      try {
        const ws = createWebSocket(path);
        wsRef.current = ws;

        ws.onopen = () => {
          if (mounted) setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as T;
            if (mounted) setLastMessage(data);
            onMessageRef.current?.(data);
          } catch (e) {
            // ignore parse errors
          }
        };

        ws.onclose = () => {
          if (mounted) {
            setIsConnected(false);
            reconnectTimeoutRef.current = window.setTimeout(connect, 5000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (e) {
        if (mounted) {
          reconnectTimeoutRef.current = window.setTimeout(connect, 5000);
        }
      }
    }

    connect();

    return () => {
      mounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [path]);

  const send = (data: string) => {
    wsRef.current?.send(data);
  };

  return { isConnected, lastMessage, send };
}
