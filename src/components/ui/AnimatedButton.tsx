
import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  loading?: boolean;
}

const variants = {
  primary: 'bg-gradient-to-r from-white to-white text-white hover:from-gray-100 hover:to-gray-100',
  secondary: 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700',
  ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-800/50',
  danger: 'border',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  glow = false,
  loading = false,
  disabled,
  className = '',
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.button
      className={`
        relative overflow-hidden rounded-lg font-mono font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${glow && variant === 'primary' ? 'shadow-[0_0_20px_rgba(6,182,212,0.4)]' : ''}
        ${className}
      `}
      style={variant === 'danger' ? {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        color: 'var(--status-error)',
        borderColor: 'rgba(239, 68, 68, 0.3)'
      } : {}}
      whileHover={!disabled ? { 
        scale: 1.02,
        y: -2,
      } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      disabled={disabled || loading}
      {...props}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Glow pulse for primary buttons */}
      {glow && variant === 'primary' && (
        <motion.div
          className="absolute inset-0 bg-white/10 rounded-lg"
          animate={{
            boxShadow: [
              '0 0 20px rgba(6,182,212,0.3)',
              '0 0 30px rgba(6,182,212,0.5)',
              '0 0 20px rgba(6,182,212,0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Content */}
      <span className="relative flex items-center justify-center gap-2">
        {loading && (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
        {children}
      </span>
    </motion.button>
  );
}
