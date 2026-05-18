
import { useState, useEffect, useCallback } from 'react';

interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnline: Date | null;
}

export function useOfflineDetection() {
  // Start with true to avoid hydration mismatch
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    wasOffline: false,
    lastOnline: null,
  });

  const handleOnline = useCallback(() => {
    setState(prev => ({
      isOnline: true,
      wasOffline: !prev.isOnline ? true : prev.wasOffline,
      lastOnline: new Date(),
    }));
  }, []);

  const handleOffline = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOnline: false,
    }));
  }, []);

  const resetWasOffline = useCallback(() => {
    setState(prev => ({ ...prev, wasOffline: false }));
  }, []);

  useEffect(() => {
    // Set actual online status after mount
    setState(prev => ({
      ...prev,
      isOnline: navigator.onLine,
    }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { ...state, resetWasOffline };
}
