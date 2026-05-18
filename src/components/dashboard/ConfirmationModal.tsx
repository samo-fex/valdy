import { useState } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (skipFuture: boolean) => void;
  onCancel: () => void;
}

export default function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmationModalProps) {
  const [skipFuture, setSkipFuture] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(skipFuture);
    setSkipFuture(false);
  };

  const handleCancel = () => {
    onCancel();
    setSkipFuture(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-white text-lg font-semibold mb-4">{title}</h3>
        
        <p className="text-gray-300 text-sm mb-6">{message}</p>
        
        <label className="flex items-center gap-2 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={skipFuture}
            onChange={(e) => setSkipFuture(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-gray-400 text-xs">Don&apos;t show this confirmation again</span>
        </label>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-white rounded text-sm transition-colors"
            style={{ backgroundColor: 'var(--status-error)' }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
