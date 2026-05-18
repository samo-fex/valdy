
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to console in development
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // In production, you would send to error tracking service
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-error', { 
        detail: { error, errorInfo, timestamp: new Date().toISOString() }
      }));
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4" role="alert">
          <motion.div 
            className="bg-gray-900 border border-red-500/50 rounded-xl p-8 max-w-lg w-full font-mono shadow-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                <AlertTriangle className="w-8 h-8" style={{ color: 'var(--status-error)' }} aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--status-error)' }}>Something went wrong</h1>
                <p className="text-gray-500 text-sm">An unexpected error occurred</p>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              The application encountered an error. You can try the options below to recover.
            </p>

            {this.state.error && (
              <details className="mb-6 bg-black/50 rounded-lg border border-gray-800">
                <summary className="cursor-pointer p-3 text-sm text-gray-500 hover:text-gray-400 flex items-center gap-2">
                  <Bug size={14} aria-hidden="true" />
                  Technical details
                </summary>
                <div className="p-3 border-t border-gray-800">
                  <p className="text-xs mb-2 font-semibold" style={{ color: 'var(--status-error)' }}>
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="text-xs text-gray-600 overflow-auto max-h-32 p-2 bg-black rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Try again without reloading"
              >
                <RefreshCw size={16} aria-hidden="true" />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 text-white rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: 'var(--status-error)'
                }}
                aria-label="Reload the page"
              >
                <RefreshCw size={16} aria-hidden="true" />
                Reload
              </button>
              <button
                onClick={this.handleGoHome}
                className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Go to home page"
              >
                <Home size={16} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
