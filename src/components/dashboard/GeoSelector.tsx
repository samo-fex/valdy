import { useState } from 'react';

interface Country {
  code: string;
  name: string;
  flag: string;
}

const countries: Country[] = [
  { code: 'GLOBAL', name: 'Global', flag: '🌍' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' }
];

interface GeoSelectorProps {
  selectedRegions: string[];
  onRegionsChange: (regions: string[]) => void;
}

export default function GeoSelector({ selectedRegions, onRegionsChange }: GeoSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isGlobal = selectedRegions.length === 0 || selectedRegions.includes('GLOBAL');

  const handleToggleCountry = (countryCode: string) => {
    if (countryCode === 'GLOBAL') {
      onRegionsChange([]);
    } else {
      const newRegions = selectedRegions.includes(countryCode)
        ? selectedRegions.filter(code => code !== countryCode && code !== 'GLOBAL')
        : [...selectedRegions.filter(code => code !== 'GLOBAL'), countryCode];
      onRegionsChange(newRegions);
    }
  };

  const getDisplayText = () => {
    if (isGlobal) return '🌍 Global';
    if (selectedRegions.length === 1) {
      const country = countries.find(c => c.code === selectedRegions[0]);
      return `${country?.flag} ${country?.name}`;
    }
    return `${selectedRegions.length} regions`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 metal-btn text-xs text-white hover:border-white transition-colors"
      >
        {getDisplayText()}
        <span className="text-gray-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 metal-container-dark rounded shadow-lg z-50 max-h-64 overflow-hidden">
          <input
            type="text"
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 metal-input border-b text-white text-xs placeholder-gray-400 relative z-10"
          />
          
          <div className="overflow-y-auto max-h-48 relative z-10">
            {filteredCountries.map((country) => (
              <label
                key={country.code}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={country.code === 'GLOBAL' ? isGlobal : selectedRegions.includes(country.code)}
                  onChange={() => handleToggleCountry(country.code)}
                  className="w-3 h-3"
                />
                <span className="text-lg">{country.flag}</span>
                <span className="text-white">{country.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
