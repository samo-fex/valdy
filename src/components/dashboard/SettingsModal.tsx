import { motion } from 'framer-motion';
import GlassCard from '@/src/components/GlassCard';
import { useState, useEffect } from 'react';

const LANG_KEY = 'valdy_language';

export default function SettingsModal() {
  const [lang, setLang] = useState<string>(localStorage.getItem(LANG_KEY) || 'English');

  useEffect(() => {
    // Hide modal initially
    const el = document.getElementById('valdy-settings-modal');
    if (el) el.classList.add('hidden');
  }, []);

  const save = () => {
    localStorage.setItem(LANG_KEY, lang);
    const el = document.getElementById('valdy-settings-modal');
    if (el) el.classList.add('hidden');
  };

  const close = () => {
    const el = document.getElementById('valdy-settings-modal');
    if (el) el.classList.add('hidden');
  };

  return (
    <div id="valdy-settings-modal" className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
      <GlassCard className="w-full max-w-md p-6 z-10">
        <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Output Language</label>
            <select
              className="w-full bg-gray-800 text-white px-3 py-2 rounded"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              <option>English</option>
              <option>French</option>
              <option>Spanish</option>
              <option>German</option>
              <option>Arabic</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={close} className="px-3 py-2 bg-gray-700 text-white rounded">Cancel</button>
            <button onClick={save} className="px-3 py-2 bg-orange-500 text-white rounded">Save</button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
