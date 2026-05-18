
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Download, Eye, FileText, Check, ChevronRight, List } from 'lucide-react';
import { Hypothesis } from '@/src/types/project';

interface PRDModalProps {
  isOpen: boolean;
  onClose: () => void;
  problems: Hypothesis[];
  solutions: Hypothesis[];
  niche: string;
  markdown: string;
}

interface Section {
  id: string;
  title: string;
  level: number;
}

export default function PRDModal({
  isOpen,
  onClose,
  problems,
  solutions,
  niche,
  markdown
}: PRDModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Parse sections from markdown
  const sections = useMemo<Section[]>(() => {
    const matches = markdown.matchAll(/^(#{1,3})\s+(.+)$/gm);
    return Array.from(matches).map((match, i) => ({
      id: `section-${i}`,
      title: match[2],
      level: match[1].length,
    }));
  }, [markdown]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySection = async (sectionTitle: string) => {
    // Find section content
    const regex = new RegExp(`^#{1,3}\\s+${sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=^#{1,3}\\s|$)`, 'gm');
    const match = markdown.match(regex);
    if (match) {
      await navigator.clipboard.writeText(match[0].trim());
      setCopiedSection(sectionTitle);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${niche.replace(/\s+/g, '-').toLowerCase()}-prd.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const scrollToSection = (sectionId: string) => {
    const index = parseInt(sectionId.split('-')[1]);
    const element = document.querySelector(`[data-section="${index}"]`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Enhanced markdown renderer with section anchors
  const renderMarkdown = (md: string) => {
    let sectionIndex = 0;
    return md
      .replace(/^### (.*$)/gim, (_, title) => {
        const html = `<h3 data-section="${sectionIndex}" class="text-base font-semibold text-white mt-4 mb-2 scroll-mt-4">${title}</h3>`;
        sectionIndex++;
        return html;
      })
      .replace(/^## (.*$)/gim, (_, title) => {
        const html = `<h2 data-section="${sectionIndex}" class="text-lg font-semibold text-white mt-6 mb-3 scroll-mt-4 flex items-center gap-2"><span class="w-1 h-5 bg-white rounded"></span>${title}</h2>`;
        sectionIndex++;
        return html;
      })
      .replace(/^# (.*$)/gim, (_, title) => {
        const html = `<h1 data-section="${sectionIndex}" class="text-xl font-bold text-white mb-4 scroll-mt-4">${title}</h1>`;
        sectionIndex++;
        return html;
      })
      .replace(/^(FR-\d+:.*)$/gim, '<div class="pl-4 py-1 border-l-2 text-sm my-1" style="border-color: var(--status-success); color: var(--status-success);">$1</div>')
      .replace(/^(NFR-\d+:.*)$/gim, '<div class="pl-4 py-1 border-l-2 text-sm my-1" style="border-color: var(--accent-primary); color: var(--accent-primary);">$1</div>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4 text-gray-300 text-sm">• $1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 text-gray-300 text-sm">• $1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-gray-800 text-white rounded text-xs">$1</code>')
      .replace(/\n\n/g, '<div class="h-3"></div>')
      .replace(/\n/g, '<br/>');
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
                <span style={{ color: 'var(--status-success)' }}>✓</span> PRD Generated
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

          {/* Tabs */}
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
                onClick={() => setActiveTab('raw')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm transition-colors ${
                  activeTab === 'raw'
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <FileText size={16} />
                <span className="hidden sm:inline">Markdown</span>
              </button>
            </div>
            {activeTab === 'preview' && sections.length > 0 && (
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`p-2 rounded-lg transition-colors ${showSidebar ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <List size={16} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar - Section Navigation */}
            <AnimatePresence>
              {activeTab === 'preview' && showSidebar && sections.length > 0 && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="hidden sm:block border-r border-gray-700 bg-gray-950 overflow-y-auto"
                >
                  <div className="p-3">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Sections</div>
                    <nav className="space-y-1">
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-gray-800 transition-colors flex items-center gap-1 group ${
                            section.level === 1 ? 'text-white font-semibold' :
                            section.level === 2 ? 'text-white pl-3' :
                            'text-gray-400 pl-5'
                          }`}
                        >
                          <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="truncate">{section.title}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopySection(section.title); }}
                            className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded"
                            title="Copy section"
                          >
                            {copiedSection === section.title ? <Check size={10} style={{ color: 'var(--status-success)' }} /> : <Copy size={10} />}
                          </button>
                        </button>
                      ))}
                    </nav>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-950">
              {activeTab === 'preview' ? (
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
                />
              ) : (
                <div className="relative">
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-xs"
                  >
                    {copied ? <Check size={14} style={{ color: 'var(--status-success)' }} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap bg-black/50 p-4 rounded-lg">
                    {markdown}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-700 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-500 text-center sm:text-left">
              ✓ Markdown format • Compatible with Notion, GitHub, Confluence
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
