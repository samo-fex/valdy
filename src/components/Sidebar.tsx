import { motion } from 'framer-motion';
import { Lightbulb, Brain, FileText, ClipboardList, Key, LogOut, User, Coins, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SectionKey } from '@/src/lib/colors';
import SettingsModal from '@/src/components/dashboard/SettingsModal';

interface SidebarProps {
  activeSection: SectionKey;
  onSectionChange: (section: SectionKey) => void;
  unlockedSections?: SectionKey[];
  newlyUnlocked?: SectionKey[];
}

const SECTIONS = [
  { key: 'INPUT' as SectionKey, icon: Lightbulb, label: 'Validate Idea' },
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

// Your app's publishable key (pk_) - shows app name on consent screen
// Get yours at https://enter.pollinations.ai
const CLIENT_ID = 'pk_n34dzFlBjzCYs9yc';

export default function Sidebar({ activeSection, onSectionChange, unlockedSections = ['INPUT', 'PROCESSING'], newlyUnlocked = [] }: SidebarProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name?: string; username?: string; balance?: number } | null>(null);

  // Check for API key in URL fragment after redirect
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const apiKey = hash.get('api_key');
    const error = hash.get('error');

    if (apiKey) {
      // Store the key
      localStorage.setItem('curatos_mode', apiKey);
      setIsConnected(true);
      
      // Clear the hash
      window.location.hash = '';
      
      // Fetch user info
      fetchUserInfo(apiKey);
    } else if (error) {
      console.error('Authorization error:', error);
      window.location.hash = '';
    }
  }, []);

  // Check if already connected on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('curatos_mode');
    if (storedKey && storedKey.startsWith('sk_')) {
      setIsConnected(true);
      fetchUserInfo(storedKey);
    }
  }, []);

  const fetchUserInfo = async (apiKey: string) => {
    try {
      const response = await fetch('https://enter.pollinations.ai/api/device/userinfo', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserInfo({
          name: data.name,
          username: data.preferred_username,
        });
      }

      // Also fetch balance
      const balanceRes = await fetch('https://gen.pollinations.ai/account/balance', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setUserInfo(prev => ({
          ...prev,
          balance: balanceData.balance,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const handleConnect = () => {
    // Build authorization URL for Pollinations.ai BYOP
    const params = new URLSearchParams({
      redirect_uri: window.location.origin + window.location.pathname,
      client_id: CLIENT_ID,
      scope: 'generate',
    });

    // Redirect to Pollinations authorization
    window.location.href = `https://enter.pollinations.ai/authorize?${params}`;
  };

  const handleDisconnect = () => {
    localStorage.removeItem('curatos_mode');
    setIsConnected(false);
    setUserInfo(null);
  };

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
              {/* Removed lock icon when section is locked */}
              {isNewlyUnlocked && (
                <span className="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500 text-white">
                  NEW
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Connection Status / Button */}
      <div className="mt-auto px-3 pb-6 space-y-3">
        {isConnected ? (
          <div className="space-y-2">
            {userInfo && (
              <div className="px-3 py-2 bg-white/5 rounded-lg space-y-1">
                {userInfo.username && (
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <User size={12} />
                    <span>{userInfo.username}</span>
                  </div>
                )}
                {userInfo.balance !== undefined && (
                  <div className="flex items-center gap-2 text-xs">
                    <Coins size={12} className="text-green-400" />
                    <span className="text-green-400">{userInfo.balance} pollen</span>
                  </div>
                )}
              </div>
            )}
            <motion.button
              onClick={handleDisconnect}
              className="w-full text-xs px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut size={12} />
              Disconnect
            </motion.button>
            <motion.button
              onClick={() => window.location.href = '/settings'}
              className="w-full text-xs px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-700 mt-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Settings size={12} />
              Settings
            </motion.button>
          </div>
        ) : (
          <motion.button
            onClick={handleConnect}
            className="w-full text-xs px-3 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium shadow-lg shadow-orange-500/25"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Key size={12} />
            Connect
          </motion.button>
        )}
        {/* Settings modal trigger for guests */}
        {!isConnected && (
          <motion.button
            onClick={() => {
              // Open modal by toggling URL fragment to avoid lifting state
              const modal = document.getElementById('valdy-settings-modal');
              if (modal) modal.classList.remove('hidden');
            }}
            className="w-full text-xs px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-700 mt-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Settings size={12} />
            Settings
          </motion.button>
        )}
      </div>

      {/* Settings Modal component (hidden by default) */}
      <SettingsModal />
      <style>{`
        @keyframes unlockGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(245, 158, 11, 0); }
          50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.6), inset 0 0 20px rgba(245, 158, 11, 0.2); }
        }
      `}</style>
    </aside>
  );
}
