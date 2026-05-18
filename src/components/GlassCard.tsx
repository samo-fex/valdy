import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import '@/src/styles/glassmorphism.css';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', onClick }: GlassCardProps) {
  return (
    <motion.div
      className={`glass-card glass-card-hover ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      {children}
    </motion.div>
  );
}
