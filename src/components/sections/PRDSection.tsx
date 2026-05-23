
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

// TypeScript interfaces for structured PRD data
export interface TargetUser {
  id: string;
  persona: string;
  age_range: string;
  description: string;
  pain_points: string[];
  primary_need: string;
}

export interface UserStory {
  id: string;
  persona_id: string;
  story: string;
  acceptance_criteria: string[];
}

export interface FunctionalRequirement {
  id: string;
  name: string;
  description: string;
  story_ids: string[];
  priority: number;
}

export interface NonFunctionalRequirement {
  id: string;
  name: string;
  category: string;
  description: string;
  target: string;
  applies_to: string[];
}

export interface PRDData {
  executive_summary: string;
  target_users: TargetUser[];
  user_stories: UserStory[];
  functional_requirements: FunctionalRequirement[];
  non_functional_requirements: NonFunctionalRequirement[];
}

interface PRDSectionProps {
  prdData: PRDData | null;
  isGenerating: boolean;
  onGenerate: () => void;
  canGenerate: boolean;
  onNextStage?: () => void;
}

// Section config
const SECTIONS = [
  { key: 'executive_summary' as const, label: 'Executive Summary' },
  { key: 'target_users' as const, label: 'Target Users & Personas' },
  { key: 'user_stories' as const, label: 'User Stories' },
  { key: 'functional_requirements' as const, label: 'Functional Requirements' },
  { key: 'non_functional_requirements' as const, label: 'Non-Functional Requirements' },
];

export default function PRDSection({ prdData, isGenerating, onGenerate, canGenerate, onNextStage }: PRDSectionProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(SECTIONS.map(s => s.key)));
  const [revealedSections, setRevealedSections] = useState<string[]>([]);

  // Sequential reveal: when prdData arrives, reveal sections one by one
  useEffect(() => {
    if (!prdData) {
      setRevealedSections([]);
      return;
    }

    const sectionKeys = SECTIONS.map(s => s.key);
    sectionKeys.forEach((key, index) => {
      setTimeout(() => {
        setRevealedSections(prev => [...prev, key]);
      }, index * 600);
    });
  }, [prdData]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-5xl mx-auto space-y-6"
      style={{ fontFamily: "'OCR-B', monospace" }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Product Requirements Document</h1>
        <p className="text-cyan-200/60">MVP PRD with traceability — Users → Stories → Requirements</p>
      </div>

      {/* Loading State — shown when no data yet */}
      {!prdData && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <motion.p
            className="text-cyan-300 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {isGenerating ? 'Analyzing business data and generating structured PRD...' : 'Preparing PRD generation...'}
          </motion.p>
        </div>
      )}

      {/* Markdown fallback when prdData is a legacy string */}
      {prdData && typeof prdData === 'string' && (
        <div className="rounded-2xl p-6" style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
          <pre className="text-white/80 text-sm whitespace-pre-wrap font-mono">{prdData}</pre>
        </div>
      )}

      {/* PRD Content — sections revealed sequentially */}
      {prdData && typeof prdData !== 'string' && (
        <>
          <div className="rounded-2xl p-6 space-y-6" style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
            {SECTIONS.map(({ key, label }) => {
              if (!revealedSections.includes(key)) return null;

              const isExpanded = expandedSections.has(key);
              return (
                <motion.div
                  key={key}
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.1)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">{label}</h3>
                    </div>
                    {isExpanded ? <ChevronUp size={18} className="text-cyan-400/60" /> : <ChevronDown size={18} className="text-cyan-400/60" />}
                  </button>

                  {/* Section Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-5 pb-5"
                      >
                        {key === 'executive_summary' && (
                          <p className="text-white/80 leading-relaxed">{prdData.executive_summary}</p>
                        )}

                        {key === 'target_users' && (
                          <div className="space-y-4">
                            {(prdData.target_users || []).map((user) => (
                              <div key={user.id} className="rounded-lg p-4" style={{ background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.1)' }}>
                                <div className="flex items-center gap-3 mb-3">
                                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-cyan-500/20 text-cyan-300">{user.id}</span>
                                  <span className="text-white font-semibold">{user.persona}</span>
                                  <span className="text-white/40 text-sm">({user.age_range})</span>
                                </div>
                                <p className="text-white/60 text-sm mb-3">{user.description}</p>
                                <div className="mb-3">
                                  <span className="text-xs text-white/40 uppercase tracking-wider font-medium">Pain Points:</span>
                                  <ul className="mt-1.5 space-y-1">
                                    {(user.pain_points || []).map((p, i) => (
                                      <li key={i} className="text-white/60 text-sm flex items-start gap-2">
                                        <span className="text-orange-400 mt-0.5">•</span>{p}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <span className="text-xs text-white/40 uppercase tracking-wider font-medium">Primary Need:</span>
                                  <p className="text-cyan-300 text-sm mt-1">{user.primary_need}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {key === 'user_stories' && (
                          <div className="space-y-4">
                            {(prdData.user_stories || []).map((story) => (
                              <div key={story.id} className="rounded-lg p-4" style={{ background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.1)' }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-cyan-500/20 text-cyan-300">{story.id}</span>
                                  <span className="text-white/30">→</span>
                                  <span className="px-2 py-0.5 text-xs font-mono rounded bg-white/5 text-white/50">{story.persona_id}</span>
                                </div>
                                <p className="text-white/70 text-sm italic mb-3">&ldquo;{story.story}&rdquo;</p>
                                <div>
                                  <span className="text-xs text-white/40 uppercase tracking-wider font-medium">Acceptance Criteria:</span>
                                  <ul className="mt-1.5 space-y-1">
                                    {(story.acceptance_criteria || []).map((ac, i) => (
                                      <li key={i} className="text-white/60 text-sm flex items-start gap-2">
                                        <span className="text-emerald-400 mt-0.5">✓</span>{ac}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {key === 'functional_requirements' && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-white/40 uppercase text-xs tracking-wider border-b border-cyan-500/10">
                                  <th className="pb-3 pr-4">ID</th>
                                  <th className="pb-3 pr-4">Priority</th>
                                  <th className="pb-3 pr-4">Name</th>
                                  <th className="pb-3 pr-4">Description</th>
                                  <th className="pb-3">Stories</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(prdData.functional_requirements || []).map((fr) => (
                                  <tr key={fr.id} className="border-b border-cyan-500/5">
                                    <td className="py-3 pr-4 font-mono text-cyan-300 text-xs">{fr.id}</td>
                                    <td className="py-3 pr-4">
                                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-500/15 text-amber-300">P{fr.priority}</span>
                                    </td>
                                    <td className="py-3 pr-4 text-white font-medium">{fr.name}</td>
                                    <td className="py-3 pr-4 text-white/60">{fr.description}</td>
                                    <td className="py-3">
                                      <div className="flex gap-1 flex-wrap">
                                        {(fr.story_ids || []).map((sid) => (
                                          <span key={sid} className="px-1.5 py-0.5 text-xs font-mono rounded bg-cyan-500/10 text-cyan-300/70">{sid}</span>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {key === 'non_functional_requirements' && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-white/40 uppercase text-xs tracking-wider border-b border-cyan-500/10">
                                  <th className="pb-3 pr-4">ID</th>
                                  <th className="pb-3 pr-4">Category</th>
                                  <th className="pb-3 pr-4">Name</th>
                                  <th className="pb-3 pr-4">Target</th>
                                  <th className="pb-3">Applies To</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(prdData.non_functional_requirements || []).map((nfr) => (
                                  <tr key={nfr.id} className="border-b border-cyan-500/5">
                                    <td className="py-3 pr-4 font-mono text-cyan-300 text-xs">{nfr.id}</td>
                                    <td className="py-3 pr-4">
                                      <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                                        nfr.category === 'Performance' ? 'bg-blue-500/15 text-blue-300' :
                                        nfr.category === 'Security' ? 'bg-red-500/15 text-red-300' :
                                        nfr.category === 'Accessibility' ? 'bg-purple-500/15 text-purple-300' :
                                        'bg-white/10 text-white/60'
                                      }`}>{nfr.category}</span>
                                    </td>
                                    <td className="py-3 pr-4 text-white font-medium">{nfr.name}</td>
                                    <td className="py-3 pr-4 text-emerald-300 font-mono text-xs">{nfr.target}</td>
                                    <td className="py-3">
                                      <div className="flex gap-1 flex-wrap">
                                        {(nfr.applies_to || []).map((ref) => (
                                          <span key={ref} className="px-1.5 py-0.5 text-xs font-mono rounded bg-cyan-500/10 text-cyan-300/70">{ref}</span>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Next Stage button — appears after all sections revealed */}
          {revealedSections.length === SECTIONS.length && onNextStage && (
            <motion.button
              onClick={onNextStage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.15)',
                animation: 'bounceGlow 1.5s ease-in-out infinite',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Next Stage → Auto Coder
            </motion.button>
          )}

          <style>{`
            @keyframes bounceGlow {
              0%, 100% { transform: translateY(0); box-shadow: 0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.15); }
              50% { transform: translateY(-4px); box-shadow: 0 0 30px rgba(16, 185, 129, 0.6), 0 0 60px rgba(16, 185, 129, 0.25); }
            }
          `}</style>
        </>
      )}
    </motion.div>
  );
}
