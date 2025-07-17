import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorReportingService } from './services/errorReporting';
import React, { createContext } from 'react';
import * as Sentry from '@sentry/react';

// Remove BrowserTracing import and integration for now if not compatible
Sentry.init({
  dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
  tracesSampleRate: 1.0,
});

// Minimal ErrorReportingProvider implementation
const ErrorReportingContext = createContext(ErrorReportingService.getInstance());
export const ErrorReportingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorReportingContext.Provider value={ErrorReportingService.getInstance()}>
    {children}
  </ErrorReportingContext.Provider>
);

// Safe DOM mounting with error handling
const rootElement = document.getElementById('root');

if (!rootElement) {
  // Create root element if it doesn't exist
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
  
  console.warn('Root element not found, created new one');
  createRoot(newRoot).render(
    <ErrorBoundary>
      <ErrorReportingProvider>
        <App />
      </ErrorReportingProvider>
    </ErrorBoundary>
  );
} else {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <ErrorReportingProvider>
        <App />
      </ErrorReportingProvider>
    </ErrorBoundary>
  );
} 