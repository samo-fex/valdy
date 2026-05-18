/**
 * Section Color Tokens for Glassmorphism UI
 */

export const SECTION_COLORS = {
  INPUT: {
    name: 'Business Idea',
    gradient: 'from-blue-600 to-blue-800',
    bg: 'bg-blue-600',
    text: 'text-blue-400',
    border: 'border-blue-500',
    glow: 'shadow-blue-500/50',
    rgb: 'rgb(37, 99, 235)',
    rgba: 'rgba(37, 99, 235, 0.1)',
  },
  PROCESSING: {
    name: 'Processing',
    gradient: 'from-yellow-500 to-amber-700',
    bg: 'bg-yellow-500',
    text: 'text-yellow-400',
    border: 'border-yellow-500',
    glow: 'shadow-yellow-500/50',
    rgb: 'rgb(245, 158, 11)',
    rgba: 'rgba(245, 158, 11, 0.1)',
  },
  BUSINESS_PLAN: {
    name: 'Business Plan',
    gradient: 'from-emerald-500 to-green-800',
    bg: 'bg-emerald-500',
    text: 'text-emerald-400',
    border: 'border-emerald-500',
    glow: 'shadow-emerald-500/50',
    rgb: 'rgb(16, 185, 129)',
    rgba: 'rgba(16, 185, 129, 0.1)',
  },
  PRD: {
    name: 'PRD',
    gradient: 'from-cyan-500 to-teal-700',
    bg: 'bg-cyan-500',
    text: 'text-cyan-400',
    border: 'border-cyan-500',
    glow: 'shadow-cyan-500/50',
    rgb: 'rgb(6, 182, 212)',
    rgba: 'rgba(6, 182, 212, 0.1)',
  },
} as const;

export type SectionKey = keyof typeof SECTION_COLORS;

/**
 * Status colors for indicators
 */
export const STATUS_COLORS = {
  IDLE: '#6b7280',
  ACTIVE: '#3b82f6',
  PROCESSING: '#f59e0b',
  COMPLETE: '#10b981',
  ERROR: '#ef4444',
} as const;
