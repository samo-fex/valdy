
import { motion, AnimatePresence } from 'framer-motion';
import { Square } from 'lucide-react';

interface StopProcessingButtonProps {
  isProcessing: boolean;
  onStop: () => void;
}

export default function StopProcessingButton({ isProcessing, onStop }: StopProcessingButtonProps) {
  return (
    <AnimatePresence>
      {isProcessing && (
        <motion.button
          onClick={onStop}
          className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg font-semibold text-white flex items-center gap-2 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            border: '2px solid rgba(239, 68, 68, 0.5)',
          }}
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            boxShadow: [
              '0 0 20px rgba(239, 68, 68, 0.5)',
              '0 0 40px rgba(239, 68, 68, 0.8)',
              '0 0 20px rgba(239, 68, 68, 0.5)',
            ],
          }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{
            boxShadow: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            },
            opacity: { duration: 0.2 },
            y: { duration: 0.2 },
            scale: { duration: 0.2 }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Stop all processing and API calls"
        >
          <Square size={18} />
          <span className="text-sm">STOP PROCESSING</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
