
import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface APIStatusBannerProps {
  error?: string | null;
  onDismiss?: () => void;
}

export function APIStatusBanner({ error, onDismiss }: APIStatusBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible || !error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border-b px-4 py-2 flex items-center justify-between"
      style={{ backgroundColor: 'rgba(239, 68, 68, 0.9)', borderColor: 'var(--status-error)' }}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} style={{ color: 'var(--status-error)' }} />
        <span className="text-sm font-mono" style={{ color: 'var(--text-primary-color)' }}>[ERROR] {error}</span>
      </div>
      <button onClick={() => { setVisible(false); onDismiss?.(); }} style={{ color: 'var(--status-error)' }} className="hover:opacity-75">
        <X size={16} />
      </button>
    </motion.div>
  );
}
