'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Une erreur est survenue
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                {this.state.error?.message || 'Une erreur inattendue s\'est produite'}
              </p>
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-all font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook to use error boundary in function components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => setError(null), []);
  const throwError = React.useCallback((err: Error) => setError(err), []);

  if (error) {
    throw error;
  }

  return { throwError, resetError };
}

// Simple error wrapper component
export function ErrorFallback({
  message = 'Une erreur est survenue',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center max-w-sm">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-red-300 text-sm">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-all"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
}

import React from 'react';
