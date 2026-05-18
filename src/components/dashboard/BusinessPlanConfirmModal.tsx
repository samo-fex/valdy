
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowLeft, Sparkles, FileText } from 'lucide-react';

interface BusinessPlanConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onGoBack: () => void;
}

export default function BusinessPlanConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  onGoBack,
}: BusinessPlanConfirmModalProps) {
  const checklist = [
    'Business idea validated across 7 pillars',
    'All gaps identified and addressed',
    'Improved business description confirmed',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="max-w-lg w-full rounded-2xl border border-white/10 p-6 space-y-6"
            style={{
              background: 'rgba(17, 24, 39, 0.95)',
              backdropFilter: 'blur(24px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <div className="flex items-center gap-3">
              <Sparkles className="text-emerald-400" size={24} />
              <h2 className="text-2xl font-bold text-white">Ready to Generate Business Plan</h2>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              {checklist.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.3 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-white/80 text-sm">{item}</span>
                </motion.div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onGoBack();
                  onClose();
                }}
                className="flex-1 py-3 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10"
              >
                <ArrowLeft size={18} />
                Go Back to Review
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 py-3 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                }}
              >
                Confirm and Create Business Plan
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
