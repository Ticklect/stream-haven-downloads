import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Shield, Download, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ErrorHandlerProps {
  error: string | null;
  errorType?: 'network' | 'cors' | 'download' | 'media' | 'source' | 'validation' | 'unknown';
  onRetry?: () => void;
  onAlternativeAction?: () => void;
  onDismiss?: () => void;
  showRecoveryOptions?: boolean;
  className?: string;
}

export const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  error,
  errorType = 'unknown',
  onRetry,
  onAlternativeAction,
  onDismiss,
  showRecoveryOptions = true,
  className = ''
}) => {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return <WifiOff className="h-4 w-4" />;
      case 'cors':
        return <Shield className="h-4 w-4" />;
      case 'download':
        return <Download className="h-4 w-4" />;
      case 'media':
        return <Play className="h-4 w-4" />;
      case 'source':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'network':
        return 'Network Connection Error';
      case 'cors':
        return 'Cross-Origin Resource Error';
      case 'download':
        return 'Download Failed';
      case 'media':
        return 'Media Playback Error';
      case 'source':
        return 'Content Source Error';
      case 'validation':
        return 'Validation Error';
      default:
        return 'An Error Occurred';
    }
  };

  const getErrorDescription = () => {
    switch (errorType) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case 'cors':
        return 'This content is blocked by browser security policies. The system is trying alternative sources.';
      case 'download':
        return 'The download could not be completed. This might be due to network issues or the file being unavailable.';
      case 'media':
        return 'The media file could not be played. This could be due to format incompatibility or network issues.';
      case 'source':
        return 'The content source is currently unavailable. Please try again later or use a different source.';
      case 'validation':
        return 'The provided information is invalid. Please check your input and try again.';
      default:
        return error;
    }
  };

  const getRecoveryActions = () => {
    const actions = [];

    if (onRetry) {
      actions.push(
        <Button
          key="retry"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      );
    }

    if (onAlternativeAction) {
      actions.push(
        <Button
          key="alternative"
          variant="outline"
          size="sm"
          onClick={onAlternativeAction}
          className="flex items-center gap-2"
        >
          <Wifi className="h-4 w-4" />
          Try Alternative
        </Button>
      );
    }

    if (onDismiss) {
      actions.push(
        <Button
          key="dismiss"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      );
    }

    return actions;
  };

  const getErrorSeverity = () => {
    switch (errorType) {
      case 'network':
      case 'cors':
        return 'default';
      case 'download':
      case 'media':
        return 'destructive';
      case 'source':
        return 'default';
      default:
        return 'destructive';
    }
  };

  return (
    <Card className={`border-l-4 border-l-red-500 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getErrorIcon()}
            <CardTitle className="text-lg">{getErrorTitle()}</CardTitle>
            <Badge variant={getErrorSeverity()}>
              {errorType.toUpperCase()}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          {getErrorDescription()}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Alert variant={getErrorSeverity()}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Details</AlertTitle>
          <AlertDescription className="font-mono text-xs">
            {error}
          </AlertDescription>
        </Alert>

        {showRecoveryOptions && getRecoveryActions().length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {getRecoveryActions()}
          </div>
        )}

        {errorType === 'network' && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Network Troubleshooting:</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>• Disable VPN if you're using one</li>
              <li>• Check if the service is available in your region</li>
            </ul>
          </div>
        )}

        {errorType === 'cors' && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">CORS Issue Resolution:</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• The system is automatically trying alternative sources</li>
              <li>• This is a browser security feature, not a bug</li>
              <li>• Some content may be unavailable due to server restrictions</li>
            </ul>
          </div>
        )}

        {errorType === 'media' && (
          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Media Playback Tips:</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Try a different browser</li>
              <li>• Update your browser to the latest version</li>
              <li>• Check if your browser supports the media format</li>
              <li>• Try downloading the content instead</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Specialized error handlers for specific use cases
export const NetworkErrorHandler: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <ErrorHandler
    error={error}
    errorType="network"
    onRetry={onRetry}
    showRecoveryOptions={true}
  />
);

export const MediaErrorHandler: React.FC<{ error: string; onRetry: () => void; onDownload?: () => void }> = ({ 
  error, 
  onRetry, 
  onDownload 
}) => (
  <ErrorHandler
    error={error}
    errorType="media"
    onRetry={onRetry}
    onAlternativeAction={onDownload}
    showRecoveryOptions={true}
  />
);

export const DownloadErrorHandler: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <ErrorHandler
    error={error}
    errorType="download"
    onRetry={onRetry}
    showRecoveryOptions={true}
  />
);

export const SourceErrorHandler: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <ErrorHandler
    error={error}
    errorType="source"
    onRetry={onRetry}
    showRecoveryOptions={true}
  />
); 