import { memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { Hypothesis } from '@/src/types/project';
import HypothesisItemEnhanced from './HypothesisItemEnhanced';
import GlassCard from '@/src/components/GlassCard';

interface HypothesisColumnProps {
  title: string;
  hypotheses: Hypothesis[];
  score: number;
  percentage?: number;
  locked?: boolean;
  validatedCount?: number;
  requiredCount?: number;
  onItemClick: (hypothesis: Hypothesis) => void;
  onItemRemove: (hypothesis: Hypothesis) => void;
  onAdd?: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const HypothesisColumn = memo(function HypothesisColumn({ 
  title, hypotheses, score, percentage, locked = false, validatedCount = 0, requiredCount = 3, onItemClick, onItemRemove 
}: HypothesisColumnProps) {
  
  const handleItemClick = useCallback((hypothesis: Hypothesis) => {
    onItemClick(hypothesis);
  }, [onItemClick]);

  const handleItemRemove = useCallback((hypothesis: Hypothesis) => {
    onItemRemove(hypothesis);
  }, [onItemRemove]);

  const progress = requiredCount > 0 ? (validatedCount / requiredCount) * 100 : 0;
  
  return (
    <div className="flex-1 min-w-0">
      <GlassCard className="p-6 h-full bg-white/10 border-white/20 hover:border-amber-300/50 transition-all backdrop-blur-xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-white" />
              <h2 className="text-xl font-semibold text-white capitalize">{title}</h2>
            </div>
            <motion.div 
              className="text-2xl font-bold text-white"
              key={score}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {score}
            </motion.div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/90">
                {validatedCount} / {requiredCount} validated
              </span>
              {percentage !== undefined && (
                <span className="text-white font-medium">{percentage}%</span>
              )}
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 shadow-orange-400/50 shadow-lg"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {locked ? (
          <motion.div 
            className="flex flex-col items-center justify-center h-64 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, -5, 5, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Lock size={48} className="text-white/50 mb-4" />
            </motion.div>
            <p className="text-white/80 text-sm font-medium">
              Complete previous requirements to unlock
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-3 max-h-[600px] overflow-y-auto pr-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {hypotheses.map((hypothesis, index) => (
                <motion.div
                  key={hypothesis.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <HypothesisItemEnhanced
                    hypothesis={hypothesis}
                    onClick={() => handleItemClick(hypothesis)}
                    onRemove={() => handleItemRemove(hypothesis)}
                    index={index}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {hypotheses.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-32 text-white/60 text-sm"
              >
                <Sparkles size={32} className="mb-2 opacity-50" />
                <p>No {title} yet</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </GlassCard>
    </div>
  );
});

export default HypothesisColumn;
