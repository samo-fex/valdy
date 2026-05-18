
import { motion } from 'framer-motion';

interface ModalLoadingProps {
  message?: string;
}

export default function ModalLoading({ message = 'Loading...' }: ModalLoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        className="flex flex-col items-center gap-4 p-8 bg-gray-900 rounded-xl border border-gray-800"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Spinner */}
        <motion.div
          className="w-10 h-10 border-3 border-white border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Loading text */}
        <motion.p
          className="text-gray-400 font-mono text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}
