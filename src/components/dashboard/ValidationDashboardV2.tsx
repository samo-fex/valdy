
import { motion } from 'framer-motion';
import { Target, Pencil, ArrowRight } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import GlassCard from '@/src/components/GlassCard';
import EvidenceMatrix from './EvidenceMatrix';
import '@/src/styles/validation-dashboard.css';

/**
 * ValidationDashboardV2 - Steve Jobs Edition
 *
 * Design Principles:
 * 1. Horizontal progress bars - Consistent across all scores
 * 2. Consistent sizing - Every card same width
 * 3. Single accent color - Amber (#F59E0B)
 * 4. Perfect typography - SF Pro hierarchy
 * 5. Mathematical spacing - 8px grid
 */

interface Source {
  apiId?: string;
  apiName?: string;
  apiIcon?: string;
  apiColor?: string;
  // Legacy fields for backward compatibility
  type?: string;
  icon?: string;
  color?: string;
  name?: string;
  status: string;
  title?: string;
  url?: string;
  snippet?: string;
  supports?: string[];
  concerns?: string[];
  confidence?: number;
}

interface Subcategory {
  key: string;
  name: string;
  score: number | null;
  status: string;
  sources: Source[];
}

interface Pillar {
  key: string;
  name: string;
  icon: string;
  score: number | null;
  status: string;
  subcategories: Subcategory[];
}

interface GapAnalysis {
  pillarName: string;
  score: number;
  diagnosis: string;
  actions: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface ValidationDashboardV2Props {
  idea?: string;
  canonicalDescription?: string;
  overallScore: number | null;
  scoreLabel?: string;
  pillars: Pillar[];
  onSourceClick: (source: Source) => void;
  agentLogs?: string[];
  onStartOver?: () => void;
  onCloseGaps?: () => void;
  gapAnalysis?: GapAnalysis[];
  isAnalyzingGaps?: boolean;
  improvedIdea?: Record<string, string>;
  isResearchComplete?: boolean;
  onProceedToPlan?: () => void;
}

// Score label based on value
function getScoreVerdict(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Strong';
  if (score >= 60) return 'Viable';
  if (score >= 50) return 'Moderate';
  if (score >= 40) return 'Weak';
  return 'Critical';
}

export default function ValidationDashboardV2({
  idea,
  canonicalDescription,
  overallScore,
  scoreLabel,
  pillars,
  onSourceClick,
  agentLogs = [],
  onStartOver,
  onCloseGaps,
  gapAnalysis = [],
  isAnalyzingGaps = false,
  improvedIdea,
  isResearchComplete = false,
  onProceedToPlan
}: ValidationDashboardV2Props) {
  const verdict = overallScore ? getScoreVerdict(overallScore) : '';
  const gapPillars = pillars.filter(p => (p.score ?? 0) < 70);
  
  const closeGapsRef = useRef<HTMLButtonElement>(null);
  const improvedIdeaRef = useRef<HTMLDivElement>(null);
  const [revealedPillars, setRevealedPillars] = useState<string[]>([]);
  const [typewriterTexts, setTypewriterTexts] = useState<Record<string, string>>({});
  const [editingImprovedPillar, setEditingImprovedPillar] = useState<string | null>(null);
  const [editImprovedText, setEditImprovedText] = useState('');
  const [fakeProgress, setFakeProgress] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  // Fake progress animation when research is in progress
  useEffect(() => {
    if ((overallScore === null || overallScore === 0) && !isResearchComplete) {
      const interval = setInterval(() => {
        setFakeProgress(prev => {
          if (prev >= 10) { clearInterval(interval); return 10; }
          return prev + 0.5;
        });
      }, 400);
      return () => clearInterval(interval);
    } else {
      setFakeProgress(0);
    }
  }, [overallScore, isResearchComplete]);

  // Counting animation for score display
  useEffect(() => {
    const target = overallScore ?? 0;
    if (target === displayScore) return;
    const step = target > displayScore ? 1 : -1;
    const interval = setInterval(() => {
      setDisplayScore(prev => {
        if (prev === target) { clearInterval(interval); return prev; }
        return prev + step;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [overallScore, displayScore]);

  // Check localStorage on mount for improved idea
  useEffect(() => {
    const saved = localStorage.getItem('curatos_improved_idea');
    if (saved && improvedIdea) {
      const allPillars = ['problem', 'market', 'competition', 'solution', 'monetization', 'gtm', 'timing'];
      setRevealedPillars(allPillars);
      const allTexts: Record<string, string> = {};
      allPillars.forEach(p => { allTexts[p] = improvedIdea[p] || ''; });
      setTypewriterTexts(allTexts);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to Close the Gaps button when it appears
  useEffect(() => {
    if (gapPillars.length > 0 && gapAnalysis.length === 0 && closeGapsRef.current) {
      setTimeout(() => {
        closeGapsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [gapPillars.length, gapAnalysis.length]);

  // Scroll to improved idea and start typewriter when it appears
  useEffect(() => {
    if (!improvedIdea) return;
    
    // Save to localStorage when new data arrives
    localStorage.setItem('curatos_improved_idea', JSON.stringify(improvedIdea));
    
    // Check if already shown (remount scenario)
    const saved = localStorage.getItem('curatos_improved_idea_shown');
    if (saved === JSON.stringify(improvedIdea)) {
      const allPillars = ['problem', 'market', 'competition', 'solution', 'monetization', 'gtm', 'timing'];
      setRevealedPillars(allPillars);
      const allTexts: Record<string, string> = {};
      allPillars.forEach(p => { allTexts[p] = improvedIdea[p] || ''; });
      setTypewriterTexts(allTexts);
      return;
    }
    
    if (improvedIdeaRef.current) {
      setTimeout(() => {
        improvedIdeaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
      
    // Start sequential reveal with typewriter
    const pillars = ['problem', 'market', 'competition', 'solution', 'monetization', 'gtm', 'timing'];
    setRevealedPillars([]);
    setTypewriterTexts({});
    
    pillars.forEach((pillar, index) => {
      setTimeout(() => {
        setRevealedPillars(prev => [...prev, pillar]);
        
        const text = improvedIdea[pillar] || '';
        let charIndex = 0;
        const typeInterval = setInterval(() => {
          if (charIndex <= text.length) {
            setTypewriterTexts(prev => ({
              ...prev,
              [pillar]: text.substring(0, charIndex)
            }));
            charIndex++;
          } else {
            clearInterval(typeInterval);
          }
        }, 25);
      }, index * 400);
    });
    
    // Mark as shown after starting animation
    localStorage.setItem('curatos_improved_idea_shown', JSON.stringify(improvedIdea));
  }, [improvedIdea]);

  return (
    <div className="vd-container">
      {/* Overall Score Progress Bar */}
      <motion.div
        className="vd-overall-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ maxWidth: '100%', margin: '0 auto 32px', padding: '0 20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '48px', fontWeight: '700', color: '#FFFFFF', lineHeight: '1' }}>
              {displayScore}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
              {verdict}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              height: '24px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px', 
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(overallScore && overallScore > 0) ? overallScore : fakeProgress}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: (overallScore ?? 0) >= 70 
                    ? 'linear-gradient(90deg, #10B981, #34D399)' 
                    : (overallScore ?? 0) >= 50 
                    ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' 
                    : 'linear-gradient(90deg, #EF4444, #F87171)',
                  boxShadow: (overallScore ?? 0) >= 70 
                    ? '0 0 20px rgba(16, 185, 129, 0.4)' 
                    : (overallScore ?? 0) >= 50 
                    ? '0 0 20px rgba(245, 158, 11, 0.4)' 
                    : '0 0 20px rgba(239, 68, 68, 0.4)',
                  borderRadius: '12px'
                }}
              />
            </div>
          </div>
          
          {/* Action Button - Refine Business Idea */}
          {onCloseGaps && overallScore !== null && gapAnalysis.length === 0 && isResearchComplete && !improvedIdea && (
            <motion.button
              ref={closeGapsRef}
              onClick={onCloseGaps}
              disabled={isAnalyzingGaps}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all whitespace-nowrap"
              style={{
                background: isAnalyzingGaps 
                  ? 'rgba(34, 197, 94, 0.5)' 
                  : 'linear-gradient(135deg, #22C55E, #16A34A)',
                cursor: isAnalyzingGaps ? 'not-allowed' : 'pointer',
                animation: isAnalyzingGaps ? 'none' : 'bounceGlow 1.5s ease-in-out infinite',
                boxShadow: isAnalyzingGaps ? 'none' : '0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.2)'
              }}
              whileHover={!isAnalyzingGaps ? { scale: 1.05 } : {}}
              whileTap={!isAnalyzingGaps ? { scale: 0.95 } : {}}
            >
              <Target size={18} />
              {isAnalyzingGaps ? 'Analyzing...' : 'Refine Business Idea'}
            </motion.button>
          )}
        </div>
        <div className="vd-overall-mini-scores">
          {pillars.slice(0, 7).map((pillar) => (
            <div key={pillar.key} className="vd-mini-score">
              <div className="vd-mini-score-value">{pillar.score || 0}</div>
              <div className="vd-mini-score-label">{pillar.name.split(' ')[0]}</div>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes gapGlow {
            0%, 100% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.3); }
            50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.8), 0 0 80px rgba(245, 158, 11, 0.4); }
          }
          @keyframes bounceGlow {
            0%, 100% { transform: translateY(0); box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
            50% { transform: translateY(-4px); box-shadow: 0 0 30px rgba(34, 197, 94, 0.7), 0 0 60px rgba(34, 197, 94, 0.3); }
          }
        `}</style>
      </motion.div>

      {/* Refined Business Idea */}
      {improvedIdea && (
        <div ref={improvedIdeaRef} style={{ maxWidth: '1000px', width: '100%', margin: '32px auto', padding: '0 20px' }}>
          <GlassCard className='p-6 space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-white'>Refined Business Idea (7 Pillars)</label>
              <div className='grid grid-cols-2 gap-4'>
                {['problem', 'market', 'competition', 'solution', 'monetization', 'gtm', 'timing'].map((pillar) => {
                  if (!revealedPillars.includes(pillar)) return null;
                  
                  const displayText = typewriterTexts[pillar] || '';
                  const fullText = improvedIdea[pillar] || '';
                  
                  return (
                    <motion.div
                      key={pillar}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className={`bg-white/5 border border-white/10 rounded-lg p-4 ${pillar === 'timing' ? 'col-span-2' : ''}`}
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <h3 className='text-sm font-bold text-white uppercase'>{pillar}</h3>
                        <button
                          onClick={() => { setEditingImprovedPillar(pillar); setEditImprovedText(fullText); }}
                          className='text-white/60 hover:text-white transition-colors'
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                      {editingImprovedPillar === pillar ? (
                        <div className='space-y-2'>
                          <textarea
                            value={editImprovedText}
                            onChange={(e) => setEditImprovedText(e.target.value)}
                            className='w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50'
                            rows={3}
                          />
                          <div className='flex gap-2'>
                            <button
                              onClick={() => {
                                setTypewriterTexts(prev => ({ ...prev, [pillar]: editImprovedText }));
                                setEditingImprovedPillar(null);
                              }}
                              className='px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded'
                            >Save</button>
                            <button
                              onClick={() => setEditingImprovedPillar(null)}
                              className='px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded'
                            >Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className='text-sm text-white/80 leading-relaxed' style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {displayText}
                          {displayText.length < fullText.length && (
                            <span className='inline-block w-1 h-4 bg-orange-400 ml-1 animate-pulse' />
                          )}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className='flex gap-3'>
              <motion.button
                onClick={onCloseGaps}
                className='flex-1 py-3 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 bg-white/10 border border-white/20 hover:bg-white/20'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Regenerate
              </motion.button>
              {onProceedToPlan && (
                <motion.button
                  onClick={onProceedToPlan}
                  className='flex-1 py-3 rounded-lg font-medium text-black transition-all flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300'
                  style={{ boxShadow: '0 0 15px rgba(0, 242, 255, 0.4)' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Proceed to Business Plan <ArrowRight size={18} />
                </motion.button>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Evidence Matrix - hidden for now */}
      {/* <EvidenceMatrix pillars={pillars} onSourceClick={onSourceClick} /> */}
    </div>
  );
}

