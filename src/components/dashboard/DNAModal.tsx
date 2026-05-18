import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Play, FileText, Globe, CheckCircle2, Loader2 } from 'lucide-react';
import { DNAData } from '@/src/types/project';
import AutoCoderPanel from './AutoCoderPanel';

const getTabColorStyle = (color: string) => {
  const colors: Record<string, string> = {
    cyan: 'var(--accent-primary)',
    green: 'var(--status-success)',
    yellow: 'var(--status-warning)',
    orange: 'var(--status-warning)',
    red: 'var(--status-error)',
    purple: 'var(--accent-primary)',
  };
  return colors[color] || 'var(--text-secondary-color)';
};

interface DNAModalProps {
  dna: DNAData | null;
  onClose: () => void;
  onStartBuild: () => void;
  onExport: () => void;
  onGenerateLandingPage?: () => void;
  onGeneratePRD?: () => void;
  isGeneratingLandingPage?: boolean;
  isGeneratingPRD?: boolean;
}

export default function DNAModal({ 
  dna, 
  onClose, 
  onStartBuild, 
  onExport,
  onGenerateLandingPage,
  onGeneratePRD,
  isGeneratingLandingPage = false,
  isGeneratingPRD = false
}: DNAModalProps) {
  const [activeTab, setActiveTab] = useState<'dna' | 'autocoder'>('dna');
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  
  // Focus trap and keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Focus close button on mount
    closeButtonRef.current?.focus();
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  
  if (!dna) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dna-modal-title"
      >
        <motion.div 
          ref={modalRef}
          className="metal-container-dark border rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="p-6 border-b border-gray-700/50">
            <div className="flex justify-between items-start">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h1 id="dna-modal-title" className="text-2xl font-bold font-mono flex items-center gap-2" style={{ color: 'var(--metal-accent)' }}>
                  <CheckCircle2 size={28} style={{ color: 'var(--status-success)' }} aria-hidden="true" />
                  DNA GENERATED
                </h1>
                <p className="text-gray-400 text-sm mt-1 font-mono">
                  {dna.niche.toUpperCase()} • {formatDate(dna.generatedAt)}
                </p>
              </motion.div>
              <motion.button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close DNA modal"
                className="text-gray-500 hover:text-gray-300 p-2 hover:bg-gray-800/50 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-white"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} aria-hidden="true" />
              </motion.button>
            </div>
          </header>

          {/* Tabs */}
          <nav className="flex px-6 border-b border-gray-700/50" role="tablist" aria-label="DNA modal tabs">
            {[
              { id: 'dna', label: 'DNA ANALYSIS', color: 'green' },
              { id: 'autocoder', label: 'AUTO-CODER', color: 'cyan' }
            ].map((tab, i) => (
              <motion.button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                id={`${tab.id}-tab`}
                onClick={() => setActiveTab(tab.id as 'dna' | 'autocoder')}
                className={`px-6 py-3 font-mono text-sm transition-all relative focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white ${
                  activeTab === tab.id
                    ? ''
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                style={activeTab === tab.id ? { color: getTabColorStyle(tab.color) } : {}}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -2 }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: getTabColorStyle(tab.color) }}
                    layoutId="activeTab"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </nav>

          {/* Content */}
          <main className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <AnimatePresence mode="wait">
              {activeTab === 'dna' ? (
                <motion.div
                  key="dna"
                  id="dna-panel"
                  role="tabpanel"
                  aria-labelledby="dna-tab"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Problems */}
                  <Section title="VALIDATED PROBLEMS" count={dna.problems.length} delay={0}>
                    <ul role="list" aria-label="Validated problems">
                      {dna.problems.map((problem, i) => (
                        <ItemCard key={problem.id} item={problem} index={i} />
                      ))}
                    </ul>
                  </Section>

                  {/* Solutions */}
                  <Section title="VALIDATED SOLUTIONS" count={dna.solutions.length} delay={0.1}>
                    <ul role="list" aria-label="Validated solutions">
                      {dna.solutions.map((solution, i) => (
                        <ItemCard key={solution.id} item={solution} index={i} />
                      ))}
                    </ul>
                  </Section>

                  {/* Requirements */}
                  <Section title="REQUIREMENTS" count={dna.requirements.length} delay={0.2}>
                    <ul role="list" aria-label="Requirements">
                      {dna.requirements.map((req, i) => (
                        <motion.li
                          key={req.id}
                          className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-white/30 transition-all"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ x: 4 }}
                        >
                          <CheckCircle2 size={16} style={{ color: 'var(--status-success)' }} className="flex-shrink-0" aria-hidden="true" />
                          <span className="text-gray-300 flex-1 text-sm">{req.text}</span>
                          <span className={`text-xs px-2 py-1 rounded font-mono ${
                            req.type === 'functional' 
                              ? 'bg-white/10 text-white border border-white/30' 
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}>
                            {req.type === 'functional' ? 'FUNC' : 'NON-FUNC'}
                          </span>
                          <span className="text-sm font-mono font-semibold" style={{ color: 'var(--status-success)' }} aria-label={`${req.confidence}% confidence`}>
                            {req.confidence}%
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </Section>

                  {/* Token Cost */}
                  <motion.div 
                    className="p-4 metal-card-dark rounded-lg border border-yellow-500/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-sm font-semibold mb-2 font-mono" style={{ color: 'var(--status-warning)' }}>TOKEN COST SUMMARY</h3>
                    <div className="text-lg text-gray-300 font-mono font-bold" aria-label={`Total token cost: ${dna.tokenCost.toLocaleString()} tokens`}>
                      {dna.tokenCost.toLocaleString()} tokens
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="autocoder"
                  id="autocoder-panel"
                  role="tabpanel"
                  aria-labelledby="autocoder-tab"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <AutoCoderPanel generatedDNA={{ requirements: dna.requirements.map(r => r.text) }} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Footer Actions */}
          <footer className="p-6 border-t border-gray-700/50 metal-panel">
            <div className="flex gap-3 relative z-10" role="group" aria-label="DNA actions">
              {onGenerateLandingPage && (
                <motion.button
                  onClick={onGenerateLandingPage}
                  disabled={isGeneratingLandingPage}
                  aria-busy={isGeneratingLandingPage}
                  aria-label={isGeneratingLandingPage ? 'Generating landing page' : 'Generate landing page'}
                  className="flex-1 metal-btn-primary py-3 px-6 rounded-lg font-mono font-semibold transition-all shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isGeneratingLandingPage ? (
                    <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> GENERATING...</>
                  ) : (
                    <><Globe size={18} aria-hidden="true" /> LANDING PAGE</>
                  )}
                </motion.button>
              )}
              {onGeneratePRD && (
                <motion.button
                  onClick={onGeneratePRD}
                  disabled={isGeneratingPRD}
                  aria-busy={isGeneratingPRD}
                  aria-label={isGeneratingPRD ? 'Generating PRD' : 'Generate Product Requirements Document'}
                  className="flex-1 border-2 border-white hover:bg-white/10 disabled:border-gray-700 text-white py-3 px-6 rounded-lg font-mono font-semibold transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isGeneratingPRD ? (
                    <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> GENERATING...</>
                  ) : (
                    <><FileText size={18} aria-hidden="true" /> GENERATE PRD</>
                  )}
                </motion.button>
              )}
              <motion.button
                onClick={onStartBuild}
                aria-label="Start building the product"
                className="flex-1 text-white py-3 px-6 rounded-lg font-mono font-semibold transition-all shadow-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900"
                style={{ 
                  backgroundColor: 'var(--status-success)'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play size={18} aria-hidden="true" /> START BUILD
              </motion.button>
              <motion.button
                onClick={onExport}
                aria-label="Export DNA data"
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 px-6 rounded-lg font-mono transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download size={18} aria-hidden="true" /> EXPORT
              </motion.button>
            </div>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper Components
function Section({ title, count, delay, children }: { title: string; count: number; delay: number; children: React.ReactNode }) {
  return (
    <motion.section 
      className="mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <h2 
        id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className="text-lg font-semibold text-white mb-3 font-mono flex items-center gap-2"
      >
        {title} <span className="text-sm text-gray-500" aria-label={`${count} items`}>({count})</span>
      </h2>
      <div className="space-y-2">
        {children}
      </div>
    </motion.section>
  );
}

function ItemCard({ item, index }: { item: { text: string; confidence: number }; index: number }) {
  return (
    <motion.li
      className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-green-500/30 transition-all"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 4 }}
    >
      <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" aria-hidden="true" />
      <span className="text-gray-300 flex-1 text-sm">{item.text}</span>
      <span className="text-green-400 text-sm font-mono font-semibold" aria-label={`${item.confidence}% confidence`}>
        {item.confidence}%
      </span>
    </motion.li>
  );
}
