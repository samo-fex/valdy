import { motion, AnimatePresence } from 'framer-motion';

interface ScoreBreakdownProps {
  isVisible: boolean;
  scores: { label: string; value: number; max: number }[];
  total: number;
}

export default function ScoreBreakdown({ isVisible, scores, total }: ScoreBreakdownProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute z-50 bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl min-w-[200px] left-0 top-full mt-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="text-xs font-mono space-y-2">
            {scores.map(({ label, value, max }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-gray-400">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-white" style={{ width: `${(value / max) * 100}%` }} />
                  </div>
                  <span className="text-gray-300 w-8 text-right">{value}</span>
                </div>
              </div>
            ))}
            <div className="border-t border-gray-700 pt-2 flex justify-between">
              <span className="text-gray-300 font-semibold">Total</span>
              <span className="font-bold" style={{ color: 'var(--status-success)' }}>{total}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
