import React from 'react';

interface Source {
  apiId?: string;
  apiName?: string;
  name?: string;
  status: string;
  title?: string;
  url?: string;
  snippet?: string;
  confidence?: number;
  domain?: string;
}

interface Subcategory {
  name: string;
  score: number | null;
  sources: Source[];
}

interface Pillar {
  name: string;
  score: number | null;
  subcategories: Subcategory[];
}

interface EvidenceMatrixProps {
  pillars: Pillar[];
  onSourceClick?: (source: Source, subcategory: string) => void;
}

const SOURCES = [
  { key: 'google', label: 'Google', domain: 'google.com', keywords: ['google', 'serper'] },
  { key: 'reddit', label: 'Reddit', domain: 'reddit.com', keywords: ['reddit'] },
  { key: 'hn', label: 'Hacker News', domain: 'news.ycombinator.com', keywords: ['ycombinator', 'hackernews', 'hn'] },
  { key: 'fred', label: 'FRED', domain: 'fred.stlouisfed.org', keywords: ['fred'] },
  { key: 'academic', label: 'Academic', domain: 'openalex.org', keywords: ['openalex', 'academic'] },
  { key: 'wikipedia', label: 'Wikipedia', domain: 'en.wikipedia.org', keywords: ['wikipedia', 'wiki'] },
  { key: 'wikidata', label: 'Wikidata', domain: 'wikidata.org', keywords: ['wikidata'] },
  { key: 'jobs', label: 'Jobs', domain: 'remoteok.com', keywords: ['remoteok', 'remote'] },
];

function matchSourceToColumn(source: Source, columnKeywords: string[]): boolean {
  const sourceName = (source.apiName || source.name || '').toLowerCase();
  const sourceUrl = (source.url || '').toLowerCase();
  const searchText = `${sourceName} ${sourceUrl}`;
  return columnKeywords.some(keyword => searchText.includes(keyword));
}

function getScoreDotStyle(score: number): React.CSSProperties {
  if (score >= 70) {
    return { backgroundColor: '#065f46', color: 'white' };
  } else if (score >= 50) {
    return { backgroundColor: '#92400e', color: 'white' };
  } else {
    return { backgroundColor: '#7f1d1d', color: 'white' };
  }
}

export default function EvidenceMatrix({ pillars, onSourceClick }: EvidenceMatrixProps) {
  const totalSubcategories = pillars.reduce((sum, p) => sum + p.subcategories.length, 0);
  const totalQueries = pillars.reduce((sum, p) => 
    sum + p.subcategories.reduce((subSum, sub) => subSum + sub.sources.length, 0), 0
  );

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      padding: '24px',
      fontFamily: "'OCR-B', monospace",
    }}>
      {/* Title Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#000000',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          Business Idea Searches
        </div>
        <div style={{
          fontSize: '10px',
          fontWeight: 600,
          color: '#333333',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {SOURCES.length} Sources / {totalSubcategories} Subcategories / {totalQueries} Queries
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12px',
        }}>
          <thead>
            <tr>
              <th style={{
                width: '220px',
                padding: '12px 8px',
                textAlign: 'left',
                color: '#000000',
                fontWeight: 600,
                borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
              }}>
                Subcategory
              </th>
              {SOURCES.map(source => (
                <th key={source.key} style={{
                  width: '60px',
                  padding: '12px 4px',
                  textAlign: 'center',
                  color: '#000000',
                  fontWeight: 600,
                  borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`}
                      alt={source.label}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <div style={{ fontSize: '9px', lineHeight: '1.2' }}>{source.label}</div>
                  </div>
                </th>
              ))}
              <th style={{
                width: '60px',
                padding: '12px 8px',
                textAlign: 'right',
                color: '#000000',
                fontWeight: 600,
                borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
              }}>
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {pillars.map((pillar, pillarIdx) => (
              <React.Fragment key={pillarIdx}>
                {/* Pillar Header Row */}
                <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.06)' }}>
                  <td style={{
                    padding: '12px 8px',
                    fontWeight: 700,
                    color: '#000000',
                    fontSize: '13px',
                  }}>
                    {pillar.name}
                  </td>
                  <td colSpan={SOURCES.length} style={{ padding: '12px 8px' }}></td>
                  <td style={{
                    padding: '12px 8px',
                    textAlign: 'right',
                    fontWeight: 700,
                    color: '#000000',
                    fontSize: '14px',
                  }}>
                    {pillar.score ?? 0}
                  </td>
                </tr>
                
                {/* Subcategory Rows */}
                {pillar.subcategories.map((subcategory, subIdx) => (
                  <tr key={subIdx} style={{
                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                  }}>
                    <td style={{
                      padding: '10px 8px',
                      color: '#1a1a1a',
                      fontSize: '12px',
                    }}>
                      {subcategory.name}
                    </td>
                    {SOURCES.map(sourceCol => {
                      const matchedSource = subcategory.sources.find(src => 
                        matchSourceToColumn(src, sourceCol.keywords)
                      );
                      
                      // Check if source is irrelevant
                      const isIrrelevant = matchedSource && (
                        matchedSource.status === 'irrelevant' || 
                        (matchedSource.confidence !== undefined && matchedSource.confidence < 20)
                      );
                      
                      return (
                        <td key={sourceCol.key} style={{
                          padding: '10px 4px',
                          textAlign: 'center',
                        }}>
                          {matchedSource && !isIrrelevant ? (
                            <div
                              onClick={() => onSourceClick?.(matchedSource, subcategory.name)}
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease',
                                ...getScoreDotStyle(matchedSource.confidence ?? 0),
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              {matchedSource.confidence ?? 0}
                            </div>
                          ) : (
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 600,
                              backgroundColor: 'rgba(0, 0, 0, 0.1)',
                              color: '#999999',
                            }}>
                              --
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td style={{
                      padding: '10px 8px',
                      textAlign: 'right',
                      fontWeight: 600,
                      color: '#000000',
                      fontSize: '13px',
                    }}>
                      {subcategory.score ?? 0}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
