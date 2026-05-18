interface QualityIndicatorProps {
  value: number; // 0-100
}

export default function QualityIndicator({ value }: QualityIndicatorProps) {
  const bars = 5;
  const filledBars = Math.ceil((value / 100) * bars);
  
  const getColor = () => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-end gap-1 h-5" aria-label={`Quality: ${value}%`}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-sm transition-all ${
            i < filledBars ? getColor() : 'bg-gray-700'
          }`}
          style={{ height: `${((i + 1) / bars) * 100}%` }}
        />
      ))}
    </div>
  );
}
