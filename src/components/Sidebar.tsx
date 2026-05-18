import { motion } from 'framer-motion';
import { Lightbulb, Brain, FileText, ClipboardList, Code2, Lock } from 'lucide-react';
import { SectionKey } from '@/src/lib/colors';

interface SidebarProps {
  activeSection: SectionKey;
  onSectionChange: (section: SectionKey) => void;
  unlockedSections?: SectionKey[];
  newlyUnlocked?: SectionKey[];
}

const SECTIONS = [
  { key: 'INPUT' as SectionKey, icon: Lightbulb, label: 'Business Idea' },
  { key: 'PROCESSING' as SectionKey, icon: Brain, label: 'Idea Refinement' },
  { key: 'BUSINESS_PLAN' as SectionKey, icon: FileText, label: 'Business Plan' },
  { key: 'PRD' as SectionKey, icon: ClipboardList, label: 'PRD' },
];

// Solid colors matching the darker end of each dashboard gradient
const ACTIVE_COLORS: Record<SectionKey, string> = {
  INPUT: '#1e40af',        // blue-800
  PROCESSING: '#b45309',   // amber-700
  BUSINESS_PLAN: '#166534', // green-800
  PRD: '#0e7490',          // cyan-700
};

export default function Sidebar({ activeSection, onSectionChange, unlockedSections = ['INPUT', 'PROCESSING'], newlyUnlocked = [] }: SidebarProps) {
  return (
    <aside 
      className="fixed left-0 top-0 h-screen w-56 flex flex-col py-8 z-50"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(20px)',
        boxShadow: '2px 0 20px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Brand/Logo Area */}
      <div className="mb-12 px-6">
        <h2 className="text-xl font-bold text-white">valdy</h2>
        <p className="text-xs text-gray-500 mt-1">Business Validation</p>
        <p className="text-[10px] text-gray-400 mt-1">Powered by pollinations.ai</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-2 px-3">
        {SECTIONS.map(({ key, icon: Icon, label }) => {
          const isActive = activeSection === key;
          const isUnlocked = unlockedSections.includes(key);
          const isNewlyUnlocked = newlyUnlocked.includes(key);
          
          return (
            <motion.button
              key={key}
              onClick={() => isUnlocked && onSectionChange(key)}
              className="flex items-center gap-3 px-4 py-3 transition-all text-left relative"
              whileHover={isUnlocked ? { scale: 1.02 } : {}}
              whileTap={isUnlocked ? { scale: 0.98 } : {}}
              style={{
                background: isActive && isUnlocked ? ACTIVE_COLORS[key] : 'transparent',
                borderRadius: isActive && isUnlocked ? '12px 0 0 12px' : '12px',
                marginRight: isActive && isUnlocked ? '-12px' : '0',
                paddingRight: isActive && isUnlocked ? '24px' : '16px',
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                animation: isNewlyUnlocked ? 'unlockGlow 2s ease-in-out 3' : 'none'
              }}
              disabled={!isUnlocked}
            >
              <Icon
                size={20}
                className={isActive && isUnlocked ? 'text-white' : 'text-gray-500'}
              />
              <span
                className={`text-sm whitespace-nowrap ${isActive && isUnlocked ? 'text-white font-semibold' : 'text-gray-400 font-medium'}`}
              >
                {label}
              </span>
              {!isUnlocked && <Lock size={14} className="text-gray-500 ml-auto" />}
              {isNewlyUnlocked && (
                <span className="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500 text-white">
                  NEW
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      <div className="mt-auto px-6 pb-6">
        <button
          onClick={() => {
            const currentKey = localStorage.getItem('curatos_mode') || '';
            const key = window.prompt('Enter your Pollinations BYOP Key:', currentKey);
            if (key !== null) {
              if (key.trim()) {
                localStorage.setItem('curatos_mode', key.trim());
                window.location.reload();
              } else {
                localStorage.removeItem('curatos_mode');
                window.location.reload();
              }
            }
          }}
          className="text-xs px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg w-full transition-colors flex items-center justify-center gap-2 border border-gray-700"
        >
          <Lock size={12} />
          Connect BYOP
        </button>
      </div>

      <style>{`
        @keyframes unlockGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(245, 158, 11, 0); }
          50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.6), inset 0 0 20px rgba(245, 158, 11, 0.2); }
        }
      `}</style>
    </aside>
  );
}
