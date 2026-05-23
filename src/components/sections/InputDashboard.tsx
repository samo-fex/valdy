import { motion } from 'framer-motion';
import { FlaskConical, CheckCircle, Pencil, RotateCcw, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import GlassCard from '@/src/components/GlassCard';

interface InputDashboardProps {
  niche: string;
  geography: string;
  onNicheChange: (niche: string) => void;
  onGeographyChange: (geo: string) => void;
  onStartValidation?: (niche: string, canonicalDescription: string, geography: string) => void;
  clearAnalysis?: number;
  onNormalizationComplete?: (analysis: any) => void;
}

const GEOGRAPHY_OPTIONS = [
  'Global',
  'North America',
  'Europe',
  'Asia Pacific',
  'Latin America',
  'Middle East',
  'Africa',
];

const COUNTRY_OPTIONS = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize',
  'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
  'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic',
  'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo (Brazzaville)',
  'Congo (Kinshasa)', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia',
  'Eswatini', 'Ethiopia',
  'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Ivory Coast',
  'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
  'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia',
  'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique',
  'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
  'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay',
  'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar',
  'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
  'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga',
  'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
  'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen',
  'Zambia', 'Zimbabwe',
];

export default function InputDashboard({
  niche,
  geography,
  onNicheChange,
  onGeographyChange,
  onStartValidation,
  clearAnalysis = 0,
  onNormalizationComplete,
}: InputDashboardProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [showCanonical, setShowCanonical] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previousIdeas, setPreviousIdeas] = useState<string[]>([]);
  
  // Clear analysis when clearAnalysis counter changes (skip initial mount with 0)
  useEffect(() => {
    if (clearAnalysis > 0) {
      setAnalysis(null);
      setShowCanonical(false);
      setRevealedPillars([]);
      setTypewriterTexts({});
      localStorage.removeItem('curatos_analysis');
    }
  }, [clearAnalysis]);
  const [editingPillar, setEditingPillar] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [revealedPillars, setRevealedPillars] = useState<string[]>([]);
  const [typewriterTexts, setTypewriterTexts] = useState<Record<string, string>>({});
  const [geoMode, setGeoMode] = useState<'region' | 'country'>(
    geography && !GEOGRAPHY_OPTIONS.includes(geography) ? 'country' : 'region'
  );

  // localStorage loading disabled - component always starts fresh

  const handleValidateIdea = async () => {
    if (!niche) return;
    
    setIsGenerating(true);
    setRevealedPillars([]);
    setTypewriterTexts({});
    
    try {
      const apiKey = localStorage.getItem('curatos_mode');
      const response = await fetch('/api/validate/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}) },
        body: JSON.stringify({ userInput: niche, geography, previousIdeas }),
      });
      
      const data = await response.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
        setShowCanonical(true);
        
        // Notify parent that normalization is complete
        onNormalizationComplete?.(data.analysis);
        
        // Save to localStorage
        localStorage.setItem('curatos_analysis', JSON.stringify(data.analysis));
        localStorage.setItem('curatos_niche', niche);
        
        // Track this idea to avoid duplicates
        const summary = Object.entries(data.analysis)
          .filter(([key]) => key !== 'normalized_idea')
          .map(([key, val]: [string, any]) => `${key}: ${(val?.title || val?.problem || JSON.stringify(val)).substring(0, 100)}`)
          .join('; ');
        setPreviousIdeas(prev => [...prev, summary]);
        
        // Sequential reveal with typewriter effect
        const pillars = ['problem', 'market', 'competition', 'solution', 'monetization', 'gtm', 'timing'];
        pillars.forEach((pillar, index) => {
          setTimeout(() => {
            setRevealedPillars(prev => [...prev, pillar]);
            
            // Typewriter effect
            const text = data.analysis[pillar] || '';
            let charIndex = 0;
            const typeInterval = setInterval(() => {
              if (charIndex <= text.length) {
                setTypewriterTexts(prev => ({
                  ...prev,
                  [pillar]: text.substring(0, charIndex)
                }));
                charIndex++;
              } else {
                clearInterval(typeInterval);
              }
            }, 25);
          }, index * 400);
        });
      }
    } catch (error) {
      console.error('Failed to normalize:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditPillar = (pillar: string, text: string) => {
    setEditingPillar(pillar);
    setEditText(text);
  };

  const handleSaveEdit = (pillar: string) => {
    const updatedAnalysis = { ...analysis, [pillar]: editText };
    setAnalysis(updatedAnalysis);
    setEditingPillar(null);
    setEditText('');
    
    // Update localStorage with edited version
    localStorage.setItem('curatos_analysis', JSON.stringify(updatedAnalysis));
  };

  const handleStartOver = () => {
    // Clear all analysis data
    setAnalysis(null);
    setShowCanonical(false);
    setRevealedPillars([]);
    setTypewriterTexts({});
    
    // Clear localStorage
    localStorage.removeItem('curatos_analysis');
    localStorage.removeItem('curatos_niche');
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Business Idea</h1>
            <p className="text-gray-400 text-sm sm:text-base">Define your market niche and validate your idea</p>
          </div>
        </div>

        {/* Configuration Card */}
        <GlassCard className="p-6 space-y-6">
              {/* Business Idea Input */}
              <div className="space-y-2">
                <label className="input-label">Business Idea</label>
                <textarea
                  value={niche}
                  onChange={(e) => onNicheChange(e.target.value)}
                  placeholder="Describe your business idea in detail..."
                  className="custom-input w-full min-h-[100px] resize-y"
                  rows={4}
                />
              </div>

              {/* Target Geography Dropdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="input-label">Target Geography</label>
                  <div className="inline-flex rounded-md border border-white/10 bg-white/5 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setGeoMode('region');
                        if (geography && !GEOGRAPHY_OPTIONS.includes(geography)) {
                          onGeographyChange('');
                        }
                      }}
                      className={`px-3 py-1 rounded transition-colors ${
                        geoMode === 'region'
                          ? 'bg-orange-500 text-white'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Region
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGeoMode('country');
                        if (geography && GEOGRAPHY_OPTIONS.includes(geography)) {
                          onGeographyChange('');
                        }
                      }}
                      className={`px-3 py-1 rounded transition-colors ${
                        geoMode === 'country'
                          ? 'bg-orange-500 text-white'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Country
                    </button>
                  </div>
                </div>
                <select
                  value={geography}
                  onChange={(e) => onGeographyChange(e.target.value)}
                  className="custom-input w-full cursor-pointer"
                >
                  <option value="">
                    {geoMode === 'country' ? 'Select target country...' : 'Select target geography...'}
                  </option>
                  {(geoMode === 'country' ? COUNTRY_OPTIONS : GEOGRAPHY_OPTIONS).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Validate Idea Button */}
              {onStartValidation && !showCanonical && (
                <motion.button
                  onClick={handleValidateIdea}
                  disabled={!niche || isGenerating}
                  className={`w-full btn-primary flex items-center justify-center gap-2 ${
                    !niche || isGenerating ? 'opacity-50 cursor-not-allowed bg-zinc-800 text-zinc-500' : ''
                  }`}
                  whileHover={niche && !isGenerating ? { scale: 1.02 } : {}}
                  whileTap={niche && !isGenerating ? { scale: 0.98 } : {}}
                >
                  <FlaskConical size={20} />
                  {isGenerating ? 'Analyzing...' : 'Validate Idea'}
                </motion.button>
              )}
            </GlassCard>

            {/* Loading State */}
            {isGenerating && (
              <GlassCard className="p-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <motion.div
                    className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.p
                    className="text-white/80 text-sm"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Analyzing your idea...
                  </motion.p>
                </div>
              </GlassCard>
            )}

            {/* Analysis Section */}
            {showCanonical && analysis && (
              <GlassCard className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Business Analysis (7 Pillars)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['problem', 'solution', 'market', 'competition', 'monetization', 'gtm', 'timing'].map((pillar, index) => {
                      if (!revealedPillars.includes(pillar)) return null;
                      
                      const description = analysis[pillar];
                      const displayText = typewriterTexts[pillar] || '';
                      const isLastPillar = pillar === 'timing';
                      
                      return (
                        <motion.div
                          key={pillar}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                          className={`bg-white/5 border border-white/10 rounded-lg p-4 ${isLastPillar ? 'md:col-span-2' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-orange-400 uppercase">{pillar}</h3>
                            <button
                              onClick={() => handleEditPillar(pillar, description as string)}
                              className="text-white/60 hover:text-white transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                          </div>
                          {editingPillar === pillar ? (
                            <div className="space-y-2">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveEdit(pillar)}
                                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingPillar(null)}
                                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-white/80 leading-relaxed">
                              {displayText}
                              {displayText.length < description.length && (
                                <span className="inline-block w-1 h-4 bg-orange-400 ml-1 animate-pulse" />
                              )}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={handleValidateIdea}
                    disabled={isGenerating}
                    className={`flex-1 py-3 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${
                      !isGenerating
                        ? 'bg-white/10 border border-white/20 hover:bg-white/20'
                        : 'bg-gray-600 cursor-not-allowed opacity-50'
                    }`}
                    whileHover={!isGenerating ? { scale: 1.02 } : {}}
                    whileTap={!isGenerating ? { scale: 0.98 } : {}}
                  >
                    <FlaskConical size={20} />
                    Regenerate
                  </motion.button>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      );
    }
