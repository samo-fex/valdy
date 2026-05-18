
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['E'], description: 'Open export modal' },
  { keys: ['Enter'], description: 'Submit / Confirm' },
  { keys: ['Esc'], description: 'Close modal / Cancel' },
  { keys: ['⌘', 'K'], description: 'Focus search / niche input' },
];

interface KeyboardShortcutsProps {
  onExport?: () => void;
}

export function KeyboardShortcuts({ onExport }: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault();
      setIsOpen(prev => !prev);
    } else if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    } else if (e.key.toLowerCase() === 'e' && !e.metaKey && !e.ctrlKey) {
      onExport?.();
    }
  }, [isOpen, onExport]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full font-mono"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white">
                <Keyboard size={20} />
                <h2 className="font-bold">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {SHORTCUTS.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <span className="text-sm text-gray-400">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, j) => (
                      <kbd
                        key={j}
                        className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded border border-gray-700"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-600 mt-4 text-center">
              Press <kbd className="px-1 bg-gray-800 rounded">Esc</kbd> to close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
