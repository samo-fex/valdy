
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface UnifiedGaugeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  label?: string;
}

/**
 * UnifiedGauge - The ONE gauge component for the entire dashboard
 *
 * Steve Jobs Principles Applied:
 * 1. ONE design - used everywhere
 * 2. Perfect proportions - mathematically precise
 * 3. Single accent color - amber only
 * 4. Subtle animation - not distracting
 */
export default function UnifiedGauge({
  score,
  size = 'medium',
  showLabel = false,
  label = ''
}: UnifiedGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  // Size configurations
  const sizes = {
    small: { width: 80, strokeWidth: 6, fontSize: 18, labelSize: 8 },
    medium: { width: 120, strokeWidth: 8, fontSize: 28, labelSize: 11 },
    large: { width: 180, strokeWidth: 10, fontSize: 42, labelSize: 12 }
  };

  const config = sizes[size];
  const center = config.width / 2;
  const radius = (config.width - config.strokeWidth) / 2 - 4;

  // Arc calculations (270 degree arc, starting from bottom-left)
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const offset = arcLength - (arcLength * animatedScore / 100);

  // Color based on score
  const getColor = (score: number) => {
    if (score >= 70) return '#10B981'; // Green
    if (score >= 40) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  return (
    <div className="vd-pillar-gauge" style={{ width: config.width, height: config.width }}>
      <svg
        width={config.width}
        height={config.width}
        viewBox={`0 0 ${config.width} ${config.width}`}
        className="vd-gauge"
      >
        {/* Background arc - transparent for glass effect */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={0}
          transform={`rotate(135 ${center} ${center})`}
        />

        {/* Animated fill arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={getColor(animatedScore)}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          transform={`rotate(135 ${center} ${center})`}
        />

        {/* Score text */}
        <text
          x={center}
          y={showLabel ? center - 6 : center}
          className="vd-gauge-score"
          style={{ fontSize: config.fontSize }}
        >
          {Math.round(animatedScore)}
        </text>

        {/* Optional label */}
        {showLabel && label && (
          <text
            x={center}
            y={center + config.fontSize / 2 + 4}
            className="vd-gauge-label"
            style={{ fontSize: config.labelSize }}
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}
