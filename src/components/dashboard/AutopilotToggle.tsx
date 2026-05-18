interface AutopilotToggleProps {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function AutopilotToggle({ enabled, onToggle, disabled = false }: AutopilotToggleProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-300 ${
        enabled
          ? 'bg-white border-white text-black shadow-lg'
          : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-white hover:text-white'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`text-sm transition-all duration-300 ${enabled ? 'animate-pulse' : ''}`}>
        ✈
      </span>
      <span className="text-xs font-mono">
        {enabled ? 'AUTOPILOT' : 'autopilot'}
      </span>
    </button>
  );
}
