
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, FlaskConical, MessageCircle, BarChart3, Globe, X } from 'lucide-react';

const SOURCE_ICONS: Record<string, any> = {
  Newspaper,
  FlaskConical,
  MessageCircle,
  BarChart3,
  Globe
};

interface Source {
  apiId?: string;
  apiName?: string;
  apiIcon?: string;
  apiColor?: string;
  // Legacy fields
  type?: string;
  icon?: string;
  status: string;
  title?: string;
  url?: string;
  snippet?: string;
  supports?: string[];
  concerns?: string[];
  confidence?: number;
}

interface SourceModalProps {
  source: Source | null;
  onClose: () => void;
}

export default function SourceModal({ source, onClose }: SourceModalProps) {
  if (!source) return null;

  const iconKey = source.icon || 'Globe';
  const SourceIcon = SOURCE_ICONS[iconKey] || Globe;
  const displayName = source.apiName || source.type || 'Unknown Source';
  const displayColor = source.apiColor || '#F59E0B';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="glass-card p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <SourceIcon className="text-yellow-400" size={28} style={{ color: displayColor }} />
              <h3 className="text-xl font-bold text-white">{displayName}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-400 transition-colors"
            >
              <X size={28} />
            </button>
          </div>

          {source.title && (
            <h4 className="text-lg font-bold text-yellow-300 mb-2">{source.title}</h4>
          )}

          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 hover:underline text-sm mb-4 block break-all"
            >
              {source.url}
            </a>
          )}

          {source.snippet && (
            <p className="text-gray-300 mb-4 leading-relaxed">{source.snippet}</p>
          )}

          {source.supports && source.supports.length > 0 && (
            <div className="mb-4">
              <h5 className="text-green-400 font-bold mb-2 flex items-center gap-2">
                <span>✓</span> Supports
              </h5>
              <ul className="space-y-2">
                {source.supports.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-300 pl-4 border-l-2 border-green-500">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {source.concerns && source.concerns.length > 0 && (
            <div className="mb-4">
              <h5 className="text-orange-400 font-bold mb-2 flex items-center gap-2">
                <span>⚠</span> Concerns
              </h5>
              <ul className="space-y-2">
                {source.concerns.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-300 pl-4 border-l-2 border-orange-500">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {source.confidence !== undefined && (
            <div>
              <h5 className="text-sm font-bold text-white mb-2">
                Confidence: {source.confidence}%
              </h5>
              <div className="w-full bg-black/30 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${source.confidence}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
