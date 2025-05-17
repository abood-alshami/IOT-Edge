import { useEffect, useState } from 'react';
import socketService from '../api/socketService';

/**
 * Hook to use socket service in React components
 * @param {string} event Socket event to subscribe to
 * @returns {Object} Object with event data and connection status
 */
export const useSocket = (event) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only connect to socket on client side
    if (typeof window === 'undefined') {
      return;
    }
    
    // Connect to socket
    socketService.connect()
      .then(() => {
        setIsConnected(true);
        setError(null);
      })
      .catch(err => {
        setError(err?.message || 'Failed to connect to socket');
        setIsConnected(false);
      });

    // Subscribe to event if provided
    let unsubscribe;
    if (event) {
      unsubscribe = socketService.subscribe(event, (newData) => {
        setData(newData);
      });
    }

    // Disconnect on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [event]);

  // Method to emit an event
  const emit = (eventName, eventData) => {
    socketService.emit(eventName, eventData);
  };

  return { data, isConnected, error, emit };
};

export default useSocket; 