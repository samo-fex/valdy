
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

function extractDomain(source: string): string | null {
  const urlMatch = source.match(/https?:\/\/([^\/\s]+)/);
  return urlMatch ? urlMatch[1].replace(/^www\./, '') : null;
}

function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function getDomainColor(domain: string): string {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash % 360)}, 60%, 45%)`;
}

function SourceBadge({ source, index }: { source: string; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const domain = extractDomain(source);
  const faviconUrl = domain ? getFaviconUrl(domain) : null;
  const bgColor = domain ? getDomainColor(domain) : '#666';
  
  return (
    <motion.div
      className="relative flex-shrink-0"
      style={{ marginLeft: index > 0 ? '-10px' : 0, zIndex: 20 - index }}
      initial={{ opacity: 0, scale: 0, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 500, 
        damping: 20,
        mass: 0.8
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        className="w-8 h-8 rounded-full border-2 border-gray-700 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: imgError ? bgColor : 'var(--bg-elevated)' }}
        whileHover={{ scale: 1.2, zIndex: 30 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        {faviconUrl && !imgError ? (
          <img 
            src={faviconUrl} 
            alt="Favicon" 
            className="w-6 h-6 object-cover rounded-full" 
            onError={() => setImgError(true)} 
          />
        ) : (
          <span className="text-xs font-bold text-white">{(domain || 'W').charAt(0).toUpperCase()}</span>
        )}
      </motion.div>
      {hovered && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 border border-gray-600 text-[9px] text-white whitespace-nowrap rounded z-50 pointer-events-none"
        >
          {domain || 'Web'}
        </motion.div>
      )}
    </motion.div>
  );
}

interface SourceStackProps {
  sources: string[];
  maxVisible?: number;
}

export default function SourceStack({ sources, maxVisible }: SourceStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(maxVisible || 15);

  useEffect(() => {
    if (maxVisible) {
      setVisibleCount(maxVisible);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const updateCount = () => {
      const width = container.offsetWidth;
      // Icon: 32px, overlap: -10px = 22px per icon after first (first is 32px)
      // Reserve 36px for +N badge
      const availableWidth = width - 36;
      const count = Math.max(3, Math.floor((availableWidth - 32) / 22) + 1);
      setVisibleCount(count);
    };

    updateCount();
    const observer = new ResizeObserver(updateCount);
    observer.observe(container);
    return () => observer.disconnect();
  }, [maxVisible]);

  if (!sources || sources.length === 0) return null;

  // Deduplicate by domain
  const uniqueSources = sources.reduce((acc, source) => {
    const domain = extractDomain(source);
    if (!acc.find(s => extractDomain(s) === domain)) acc.push(source);
    return acc;
  }, [] as string[]);

  const visible = uniqueSources.slice(0, visibleCount);
  const remaining = uniqueSources.length - visibleCount;

  return (
    <div ref={containerRef} className="flex items-center flex-1 min-w-0">
      <div className="flex items-center">
        {visible.map((source, i) => (
          <SourceBadge key={i} source={source} index={i} />
        ))}
        {remaining > 0 && (
          <div 
            className="w-8 h-8 rounded-full border-2 border-gray-700 bg-gray-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0"
            style={{ marginLeft: '-10px', zIndex: 25 }}
          >
            +{remaining}
          </div>
        )}
      </div>
    </div>
  );
}
