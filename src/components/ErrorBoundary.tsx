import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | undefined;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static override getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Optionally report error to external service
    if (typeof window !== 'undefined' && typeof (window as unknown as { reportError?: (args: { error: Error, errorInfo: ErrorInfo }) => void }).reportError === 'function') {
      (window as unknown as { reportError: (args: { error: Error, errorInfo: ErrorInfo }) => void }).reportError({ error, errorInfo });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-400 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.state.error && (
              <pre className="text-xs text-gray-500 bg-gray-900 rounded p-2 mb-4 overflow-x-auto max-w-full">
                {this.state.error.stack}
              </pre>
            )}
            <div className="text-xs text-gray-400 mb-4">
              If this is a network error, please check your connection and try again.
            </div>
            <div className="space-y-3">
              <Button 
                onClick={this.handleReset}
                className="w-full bg-[#E50914] hover:bg-[#B20710]"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full border-white text-white hover:bg-white hover:text-black"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}