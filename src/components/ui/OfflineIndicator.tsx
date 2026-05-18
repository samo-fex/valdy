
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useOfflineDetection } from '@/src/hooks/useOfflineDetection';

export function OfflineIndicator() {
  const { isOnline, wasOffline, resetWasOffline } = useOfflineDetection();

  // Auto-dismiss reconnection message after 3 seconds
  React.useEffect(() => {
    if (isOnline && wasOffline) {
      const timer = setTimeout(resetWasOffline, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, resetWasOffline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-mono"
          style={{ backgroundColor: 'var(--status-error)' }}
          role="alert"
          aria-live="assertive"
        >
          <WifiOff size={16} aria-hidden="true" />
          <span>You&apos;re offline. Some features may be unavailable.</span>
        </motion.div>
      )}
      {isOnline && wasOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-mono"
          style={{ backgroundColor: 'var(--status-success)' }}
          role="status"
          aria-live="polite"
        >
          <Wifi size={16} aria-hidden="true" />
          <span>Back online!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
