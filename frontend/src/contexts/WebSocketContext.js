import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const listenersRef = useRef(new Set());

  const getWebSocketUrl = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    // Convert http/https to ws/wss
    const wsProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
    const baseUrl = backendUrl.replace(/^https?:\/\//, '').replace(/\/api$/, '');
    return `${wsProtocol}://${baseUrl}/ws/notifications/${getUserId()}`;
  };

  const getUserId = () => {
    if (!user) return 'guest';
    // Create unique user ID for WebSocket connection
    if (user.role === 'admin') {
      return `admin:${user.username}`;
    } else {
      return `user:${user.employee_id || user.username}`;
    }
  };

  const connect = () => {
    if (!user) return;

    try {
      const wsUrl = getWebSocketUrl();
      console.log('Connecting to WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Start heartbeat
        const heartbeatInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send('ping');
          }
        }, 30000); // Ping every 30 seconds

        wsRef.current.heartbeatInterval = heartbeatInterval;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'new_notification') {
            setLastNotification(data.data);
            // Notify all listeners
            listenersRef.current.forEach(listener => listener(data.data));
            
            // Refresh sidebar notifications
            if (window.refreshSidebarNotifications) {
              window.refreshSidebarNotifications();
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Clear heartbeat
        if (wsRef.current?.heartbeatInterval) {
          clearInterval(wsRef.current.heartbeatInterval);
        }

        // Attempt to reconnect after 3 seconds
        if (user) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      if (wsRef.current.heartbeatInterval) {
        clearInterval(wsRef.current.heartbeatInterval);
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const addNotificationListener = (callback) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  };

  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user]);

  return (
    <WebSocketContext.Provider value={{ 
      isConnected, 
      lastNotification,
      addNotificationListener
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};
