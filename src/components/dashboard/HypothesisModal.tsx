import { useState, useEffect } from 'react';
import { Hypothesis } from '@/src/types/project';
import SourceStack from './SourceStack';
import { Globe, X } from 'lucide-react';

function extractDomain(source: string): string | null {
  const urlMatch = source.match(/https?:\/\/([^\/\s]+)/);
  return urlMatch ? urlMatch[1].replace(/^www\./, '') : null;
}

function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

function getScreenshotUrl(url: string): string {
  return `https://image.thum.io/get/width/128/${url}`;
}

function getLogoUrl(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

function getDomainColor(domain: string): string {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash % 360)}, 40%, 25%)`;
}

function parseSource(source: string): { title: string; snippet: string; url: string; domain: string | null } {
  if (source.includes(' ||| ')) {
    const parts = source.split(' ||| ');
    return {
      title: parts[0].replace(/^\[.*?\]\s*/, '').trim(),
      snippet: parts[1] || '',
      url: parts[2] || '#',
      domain: extractDomain(parts[2] || ''),
    };
  }
  const urlMatch = source.match(/(https?:\/\/[^\s]+)/);
  const url = urlMatch ? urlMatch[1] : '#';
  let title = source.replace(url, '').replace(/:\s*$/, '').replace(/^\[.*?\]\s*/, '').trim();
  return { title: title || extractDomain(source) || 'Source', snippet: '', url, domain: extractDomain(source) };
}

interface SourceCardProps {
  source: string;
  onRemove: () => void;
}

function SourceCard({ source, onRemove }: SourceCardProps) {
  const [loading, setLoading] = useState(true);
  const [ogImage, setOgImage] = useState<string | null>(null);
  const [ogFailed, setOgFailed] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const { title, snippet, url, domain } = parseSource(source);
  const faviconUrl = domain ? getFaviconUrl(domain) : null;
  const bgColor = domain ? getDomainColor(domain) : 'var(--border-default)';

  useEffect(() => {
    if (url === '#') {
      setLoading(false);
      return;
    }
    fetch('/api/og-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then(res => res.json())
      .then(data => {
        setOgImage(data.ogImage);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [url]);

  // Check if Reddit or HN source
  const isReddit = domain?.includes('reddit.com') || false;
  const isHN = domain?.includes('ycombinator') || domain?.includes('news.ycombinator') || false;

  // Parse Reddit snippet: "r/subreddit • 446 upvotes • 202 comments"
  const parseRedditSnippet = () => {
    const upvoteMatch = snippet.match(/(\d+)\s*upvotes?/i);
    const commentMatch = snippet.match(/(\d+)\s*comments?/i);
    return {
      upvotes: upvoteMatch?.[1] || '0',
      comments: commentMatch?.[1] || '0',
    };
  };

  // Parse HN snippet: "X points, Y comments" or "X points • Y comments"
  const parseHNSnippet = () => {
    const pointsMatch = snippet.match(/(\d+)\s*points?/i);
    const commentMatch = snippet.match(/(\d+)\s*comments?/i);
    return {
      points: pointsMatch?.[1] || '0',
      comments: commentMatch?.[1] || '0',
    };
  };

  const renderThumbnail = () => {
    if (loading) return <div className="w-full h-full animate-pulse bg-gray-700 rounded" />;
    
    // Reddit placeholder card
    if (isReddit) {
      const { upvotes, comments } = parseRedditSnippet();
      return (
        <div className="w-full h-full bg-orange-600 flex flex-col items-center justify-center text-white rounded-lg">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
          </svg>
          <div className="flex items-center gap-2 mt-1 text-[10px] font-medium">
            <span>▲{upvotes}</span>
            <span>💬{comments}</span>
          </div>
        </div>
      );
    }

    // HN placeholder card
    if (isHN) {
      const { points, comments } = parseHNSnippet();
      return (
        <div className="w-full h-full bg-orange-500 flex flex-col items-center justify-center text-white rounded-lg">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-orange-500 font-bold text-lg">Y</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] font-medium">
            <span>▲{points}</span>
            <span>💬{comments}</span>
          </div>
        </div>
      );
    }

    if (ogImage && !ogFailed) return <img src={ogImage} alt="Preview" className="w-full h-full object-cover" onError={() => setOgFailed(true)} />;
    if (!thumbFailed && url !== '#') return <img src={getScreenshotUrl(url)} alt="Screenshot" className="w-full h-full object-cover" onError={() => setThumbFailed(true)} />;
    if (domain && !logoFailed) return <img src={getLogoUrl(domain)} alt="Logo" className="w-12 h-12 object-contain" onError={() => setLogoFailed(true)} />;
    return <span className="text-2xl font-bold text-gray-500">{(domain || 'W').charAt(0).toUpperCase()}</span>;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only open link if not clicking the remove button
    if ((e.target as HTMLElement).closest('button')) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onRemove();
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative flex items-start py-3 px-3 rounded-lg bg-orange-950/30 hover:bg-orange-900/40 border border-orange-500/20 hover:border-orange-500/40 transition-all group cursor-pointer"
    >
      {/* Remove button - show on hover */}
      <button
        onClick={handleRemove}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-800/50 hover:bg-red-600/50 border border-orange-500/30 flex items-center justify-center text-gray-400 hover:text-red-300 transition-all z-10 opacity-0 group-hover:opacity-100"
        type="button"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Text content - starts at left edge */}
      <div className="flex-1 min-w-0 pr-3">
        <div className="text-white text-[11px] font-medium line-clamp-2 group-hover:text-orange-100 transition-colors leading-tight">
          {title}
        </div>
        {snippet && <div className="text-orange-200/70 text-[10px] font-medium line-clamp-2 mt-1 leading-snug">{snippet}</div>}
        <div className="text-orange-300/50 text-[9px] truncate mt-1">{domain || url}</div>
      </div>

      {/* Image with overlaid favicon */}
      <div className="relative w-20 h-20 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center border border-orange-500/30" style={{ backgroundColor: bgColor }}>
        {renderThumbnail()}
        {/* Favicon overlay on bottom-right */}
        <div className="absolute bottom-1 right-1 w-9 h-9 rounded flex items-center justify-center bg-orange-950/80 border border-orange-500/30">
          {faviconUrl ? <img src={faviconUrl} alt="Favicon" className="w-6 h-6 object-contain" /> : <Globe className="w-6 h-6 text-orange-400" />}
        </div>
      </div>
    </div>
  );
}

interface HypothesisModalProps {
  hypothesis: Hypothesis | null;
  onClose: () => void;
  onUpdateSources?: (hypothesisId: string, sources: string[]) => void;
}

export default function HypothesisModal({ hypothesis, onClose, onUpdateSources }: HypothesisModalProps) {
  const [localSources, setLocalSources] = useState<string[]>([]);

  useEffect(() => {
    setLocalSources(hypothesis?.sources || []);
  }, [hypothesis]);

  if (!hypothesis) return null;

  const handleRemoveSource = (index: number) => {
    const newSources = localSources.filter((_, i) => i !== index);
    setLocalSources(newSources);
    onUpdateSources?.(hypothesis.id, newSources);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gradient-to-br from-orange-900/95 to-amber-900/95 backdrop-blur-xl border border-orange-500/30 rounded-lg max-w-lg w-full font-mono max-h-[80vh] flex flex-col overflow-hidden shadow-2xl shadow-orange-500/20">
        {/* Header - fixed, no overflow */}
        <div className="p-4 border-b border-orange-500/30 bg-orange-950/50 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="text-white text-sm flex-1 pr-2">{hypothesis.text}</div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {hypothesis.confidence > 0 && (
                <span className={`text-sm font-bold tabular-nums ${hypothesis.confidence >= 90 ? 'text-green-400' : hypothesis.confidence >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {hypothesis.confidence}%
                </span>
              )}
              <button onClick={onClose} className="bg-orange-800/50 hover:bg-orange-700/50 border border-orange-500/30 text-gray-300 hover:text-white transition-colors text-xl leading-none w-8 h-8 flex items-center justify-center rounded">×</button>
            </div>
          </div>
        </div>

        {/* Sources - scrollable */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col min-h-0">
          {localSources.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <SourceStack sources={localSources} />
                <span className="text-gray-400 text-xs flex-shrink-0">{localSources.length} sources</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 scrollbar-thin">
                {localSources.map((source, i) => (
                  <SourceCard key={i} source={source} onRemove={() => handleRemoveSource(i)} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-xs flex items-center justify-center h-32">
              <div className="text-center">
                <Globe className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <div>No sources available</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(75,85,99,0.6); border-radius: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(107,114,128,0.8); }
      `}</style>
    </div>
  );
}
