
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Download, Eye, Code, Check, Smartphone, Monitor, Tablet } from 'lucide-react';
import { Hypothesis } from '@/src/types/project';

interface LandingPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  problems: Hypothesis[];
  solutions: Hypothesis[];
  niche: string;
  html: string;
}

type ViewMode = 'desktop' | 'tablet' | 'mobile';

export default function LandingPageModal({
  isOpen,
  onClose,
  problems,
  solutions,
  niche,
  html
}: LandingPageModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');

  if (!isOpen) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${niche.replace(/\s+/g, '-').toLowerCase()}-landing-page.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPreviewWidth = () => {
    switch (viewMode) {
      case 'mobile': return 'max-w-[375px]';
      case 'tablet': return 'max-w-[768px]';
      default: return 'max-w-full';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="metal-container-dark rounded-xl w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col font-mono overflow-hidden"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
        >
          {/* Header */}
          <div className="border-b border-gray-700 p-3 sm:p-4 flex items-center justify-between">
            <div>
              <h2 className="text-white text-base sm:text-lg font-semibold flex items-center gap-2">
                <span style={{ color: 'var(--status-success)' }}>✓</span> Landing Page Generated
              </h2>
              <p className="text-gray-500 text-xs mt-1">
                {problems.length} problems + {solutions.length} solutions → {niche}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs & View Mode */}
          <div className="border-b border-gray-700 flex items-center justify-between px-2 sm:px-4">
            <div className="flex">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm transition-colors ${
                  activeTab === 'preview'
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Eye size={16} />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm transition-colors ${
                  activeTab === 'code'
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Code size={16} />
                <span className="hidden sm:inline">Code</span>
              </button>
            </div>

            {/* View mode toggle - only show in preview */}
            {activeTab === 'preview' && (
              <div className="hidden sm:flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                {[
                  { mode: 'desktop' as ViewMode, icon: Monitor },
                  { mode: 'tablet' as ViewMode, icon: Tablet },
                  { mode: 'mobile' as ViewMode, icon: Smartphone },
                ].map(({ mode, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === mode ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-gray-950 p-2 sm:p-4">
            {activeTab === 'preview' ? (
              <div className={`mx-auto h-full transition-all duration-300 ${getPreviewWidth()}`}>
                <iframe
                  srcDoc={html}
                  className="w-full h-full bg-white rounded-lg shadow-2xl"
                  title="Landing Page Preview"
                />
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-xs"
                >
                  {copied ? <Check size={14} style={{ color: 'var(--status-success)' }} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <pre className="p-4 text-xs text-gray-300 overflow-auto h-full rounded-lg bg-black/50">
                  <code className="language-html">{html}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-700 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-500 text-center sm:text-left">
              ✓ Self-contained HTML • No external dependencies • Ready to deploy
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <motion.button
                onClick={handleCopy}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                whileTap={{ scale: 0.98 }}
              >
                {copied ? <Check size={16} style={{ color: 'var(--status-success)' }} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </motion.button>
              <motion.button
                onClick={handleDownload}
                className="flex-1 sm:flex-none px-4 py-2.5 metal-btn-primary text-sm rounded-lg transition-colors font-medium flex items-center justify-center gap-2 min-h-[44px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download size={16} />
                Download
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
