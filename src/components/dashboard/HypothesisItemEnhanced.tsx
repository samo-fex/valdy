import { useState, memo, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import { Hypothesis } from '@/src/types/project';
import ScoreBreakdown from './ScoreBreakdown';
import SourceStack from './SourceStack';

interface HypothesisItemEnhancedProps {
  hypothesis: Hypothesis;
  onClick: () => void;
  onRemove: () => void;
  index?: number;
}

// Stall states
type StallState = 'ok' | 'warning' | 'critical';

// Confidence Gauge with smooth animation
function ConfidenceGauge({ 
  confidence, 
  isProcessing, 
  stallState,
  penalty 
}: { 
  confidence: number; 
  isProcessing: boolean;
  stallState: StallState;
  penalty: number;
}) {
  const effectiveConfidence = Math.max(0, confidence - penalty);
  
  const getGaugeStyle = () => {
    if (stallState === 'critical') return { backgroundColor: 'var(--status-error)' };
    if (stallState === 'warning') return { backgroundColor: 'var(--status-warning)' };
    if (effectiveConfidence >= 90) return { backgroundColor: 'var(--status-success)' };
    if (effectiveConfidence >= 50) return { backgroundColor: 'var(--status-warning)' };
    if (effectiveConfidence > 0) return { backgroundColor: 'var(--status-warning)' };
    return { backgroundColor: 'var(--border-default)' };
  };
  
  const getTextStyle = () => {
    if (stallState === 'critical') return { color: 'var(--status-error)' };
    if (stallState === 'warning') return { color: 'var(--status-warning)' };
    if (effectiveConfidence >= 90) return { color: 'var(--status-success)' };
    if (effectiveConfidence >= 50) return { color: 'var(--status-warning)' };
    if (effectiveConfidence > 0) return { color: 'var(--status-warning)' };
    return { color: 'var(--text-muted-color)' };
  };
  const zone = effectiveConfidence >= 90 ? 'FACT' : 'HYPOTHESIS';
  
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono font-bold" style={getTextStyle()}>
          CONFIDENCE: {effectiveConfidence > 0 ? `${effectiveConfidence}%` : '—'}
          {penalty > 0 && <span className="ml-1" style={{ color: 'var(--status-error)' }}>(-{penalty}%)</span>}
        </span>
        <div className="flex items-center gap-1">
          {stallState === 'warning' && (
            <AlertTriangle size={10} style={{ color: 'var(--status-warning)' }} />
          )}
          {stallState === 'critical' && (
            <AlertCircle size={10} style={{ color: 'var(--status-error)' }} />
          )}
          <span className={`text-[9px] font-mono`} style={{ color: effectiveConfidence >= 90 ? 'var(--status-success)' : 'var(--text-muted-color)' }}>
            {effectiveConfidence > 0 ? zone : 'PENDING'}
          </span>
        </div>
      </div>
      <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
        <div className="absolute left-[90%] top-0 bottom-0 w-px bg-white/30 z-10" />
        <motion.div 
          className="h-full"
          style={getGaugeStyle()}
          animate={{ width: `${effectiveConfidence}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[8px] text-gray-600 font-mono">0</span>
        <span className="text-[8px] text-gray-500 font-mono">90%</span>
        <span className="text-[8px] text-gray-600 font-mono">100</span>
      </div>
    </div>
  );
}

const HypothesisItemEnhanced = memo(function HypothesisItemEnhanced({ 
  hypothesis, onClick, onRemove, index = 0 
}: HypothesisItemEnhancedProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [displayedSourceCount, setDisplayedSourceCount] = useState(0);
  const [stallState, setStallState] = useState<StallState>('ok');
  const [penalty, setPenalty] = useState(0);
  const [displayedConfidence, setDisplayedConfidence] = useState(0);
  
  const lastSourceTimeRef = useRef<number>(Date.now());
  const revealIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stallCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevSourceCountRef = useRef(0);
  
  const status = hypothesis.status || (hypothesis.confidence > 0 ? 'complete' : 'pending');
  const isProcessing = status === 'downloading' || status === 'analyzing';
  const totalSources = hypothesis.sources?.length || 0;
  
  // TRUE one-by-one source reveal - 600ms per source
  useEffect(() => {
    const sources = hypothesis.sources || [];
    
    // New sources arrived - start revealing one by one
    if (sources.length > prevSourceCountRef.current) {
      prevSourceCountRef.current = sources.length;
      lastSourceTimeRef.current = Date.now();
      
      // Clear existing interval
      if (revealIntervalRef.current) {
        clearInterval(revealIntervalRef.current);
      }
      
      // Reveal sources one at a time, every 600ms
      revealIntervalRef.current = setInterval(() => {
        setDisplayedSourceCount(prev => {
          if (prev >= sources.length) {
            if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
            return sources.length;
          }
          lastSourceTimeRef.current = Date.now();
          return prev + 1; // Exactly +1
        });
      }, 600);
    }
    
    return () => {
      if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hypothesis.sources?.length]);
  
  // Stall detection - check every second
  useEffect(() => {
    if (!isProcessing && displayedSourceCount >= totalSources) {
      setStallState('ok');
      setPenalty(0);
      if (stallCheckIntervalRef.current) clearInterval(stallCheckIntervalRef.current);
      return;
    }
    
    stallCheckIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - lastSourceTimeRef.current) / 1000;
      
      if (elapsed > 10) {
        setStallState('critical');
        // Penalty: -2% per second over 10s
        setPenalty(prev => Math.min(30, prev + 2));
      } else if (elapsed > 5) {
        setStallState('warning');
      } else {
        setStallState('ok');
      }
    }, 1000);
    
    return () => {
      if (stallCheckIntervalRef.current) clearInterval(stallCheckIntervalRef.current);
    };
  }, [isProcessing, displayedSourceCount, totalSources]);
  
  // Smooth confidence growth as sources appear
  useEffect(() => {
    if (totalSources === 0) {
      setDisplayedConfidence(hypothesis.confidence);
      return;
    }
    
    // Base confidence + growth per source
    const baseConfidence = Math.max(10, hypothesis.confidence * 0.3);
    const perSourceGrowth = (hypothesis.confidence - baseConfidence) / totalSources;
    const newConfidence = Math.round(baseConfidence + (displayedSourceCount * perSourceGrowth));
    
    setDisplayedConfidence(Math.min(newConfidence, hypothesis.confidence));
  }, [displayedSourceCount, totalSources, hypothesis.confidence]);
  
  // Reset when hypothesis changes
  useEffect(() => {
    if (totalSources === 0) {
      setDisplayedSourceCount(0);
      setDisplayedConfidence(0);
      setPenalty(0);
      setStallState('ok');
      prevSourceCountRef.current = 0;
    }
  }, [hypothesis.id, totalSources]);
  
  // Get only revealed sources
  const displayedSources = useMemo(() => {
    return (hypothesis.sources || []).slice(0, displayedSourceCount);
  }, [hypothesis.sources, displayedSourceCount]);
  
  const isRevealing = displayedSourceCount < totalSources && totalSources > 0;
  const effectiveConfidence = Math.max(0, displayedConfidence - penalty);
  
  const config = useMemo(() => {
    if (hypothesis.state === 'fact' && effectiveConfidence >= 85) {
      return {
        color: 'var(--status-success)',
        borderColor: 'border-green-400/30',
        bgGradient: 'from-green-500/10 to-transparent',
        glow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]',
        stateLabel: 'Fact'
      };
    }
    if (hypothesis.state === 'validated' && effectiveConfidence >= 60) {
      return {
        color: 'var(--status-info)',
        borderColor: 'border-blue-400/30',
        bgGradient: 'from-blue-500/10 to-transparent',
        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
        stateLabel: 'Validated'
      };
    }
    if (hypothesis.state === 'rejected') {
      return {
        color: 'var(--status-error)',
        borderColor: 'border-red-400/30',
        bgGradient: 'from-red-500/10 to-transparent',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
        stateLabel: 'Rejected'
      };
    }
    return {
      color: 'var(--status-warning)',
      borderColor: 'border-orange-400/30',
      bgGradient: 'from-orange-500/10 to-transparent',
      glow: '',
      stateLabel: 'Unvalidated hypothesis'
    };
  }, [hypothesis.state, effectiveConfidence]);

  const isAnimating = isProcessing || isRevealing || (hypothesis.state === 'hypothesis' && hypothesis.confidence === 0);

  const breakdownScores = useMemo(() => [
    { label: 'Evidence', value: Math.round(effectiveConfidence * 0.4), max: 40 },
    { label: 'Relevance', value: Math.round(effectiveConfidence * 0.3), max: 30 },
    { label: 'Sources', value: Math.round(effectiveConfidence * 0.3), max: 30 },
  ], [effectiveConfidence]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  }, [onRemove]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onRemove();
    }
  }, [onClick, onRemove]);

  const handleMouseEnter = useCallback(() => {
    if (hypothesis.state === 'fact' || hypothesis.state === 'validated') setShowBreakdown(true);
  }, [hypothesis.state]);

  const handleMouseLeave = useCallback(() => setShowBreakdown(false), []);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 30, delay: index * 0.05 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden metal-card-dark cursor-pointer focus-within:ring-1 focus-within:ring-white/50"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="article"
      aria-label={`${config.stateLabel}: ${hypothesis.text}${effectiveConfidence > 0 ? `, ${effectiveConfidence}% confidence` : ''}`}
      tabIndex={0}
    >
      <div className="relative p-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200 leading-relaxed font-mono">
            {hypothesis.text}
          </p>

          {/* Confidence Gauge with stall indicator */}
          <ConfidenceGauge 
            confidence={displayedConfidence} 
            isProcessing={isProcessing || isRevealing}
            stallState={stallState}
            penalty={penalty}
          />

          {/* Source Stack with one-by-one reveal */}
          <motion.div 
            className="mt-2 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Spinner when processing or revealing */}
            <AnimatePresence>
              {(isProcessing || isRevealing) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="flex items-center gap-1"
                >
                  <Loader2 
                    size={14} 
                    className="animate-spin"
                    style={{ color: 
                      stallState === 'critical' ? 'var(--status-error)' : 
                      stallState === 'warning' ? 'var(--status-warning)' : 
                      'var(--text-primary-color)'
                    }} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Source icons - revealed one by one */}
            {displayedSourceCount > 0 && <SourceStack sources={displayedSources} />}
            
            {/* Live source counter */}
            <span className={`text-xs font-mono flex-shrink-0 ${
              stallState === 'critical' ? 'text-red-400' :
              stallState === 'warning' ? 'text-yellow-400' :
              'text-gray-500'
            }`}>
              {displayedSourceCount}{totalSources > displayedSourceCount ? `/${totalSources}` : ''} sources
            </span>
          </motion.div>
          
          {hypothesis.state === 'fact' && effectiveConfidence >= 85 && (
            <ScoreBreakdown
              isVisible={showBreakdown}
              scores={breakdownScores}
              total={effectiveConfidence}
            />
          )}
        </div>

        <motion.button
          onClick={handleRemove}
          aria-label={`Remove hypothesis: ${hypothesis.text.substring(0, 30)}...`}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Trash2 size={14} className="text-gray-500 hover:text-red-400 transition-colors" aria-hidden="true" />
        </motion.button>
      </div>

      {isAnimating && (
        <motion.div
          className={`absolute inset-0 border-2 rounded-lg ${
            stallState === 'critical' ? 'border-red-400/50' :
            stallState === 'warning' ? 'border-yellow-400/50' :
            'border-white/50'
          }`}
          animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
      )}
    </motion.article>
  );
});

export default HypothesisItemEnhanced;
