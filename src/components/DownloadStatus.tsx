import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2,
  AlertTriangle,
  Play,
  Pause
} from "lucide-react";
import { useDownloadManager } from '@/hooks/useDownloadManager';
import { type DownloadState } from '@/utils/downloadManager';
import { useToast } from "@/hooks/use-toast";

export const DownloadStatus: React.FC = () => {
  const {
    downloads,
    activeDownloads,
    pendingDownloads,
    completedDownloads,
    failedDownloads,
    queueLength,
    activeDownloadCount,
    maxConcurrentDownloads,
    cancelDownload,
    clearCompletedDownloads,
    retryDownload // <-- Add this to the hook if not present
  } = useDownloadManager();
  const { toast } = useToast();

  // Don't render if no downloads
  if (downloads.length === 0) {
    return null;
  }

  const getStatusIcon = (status: DownloadState['status']) => {
    switch (status) {
      case 'downloading':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: DownloadState['status']) => {
    switch (status) {
      case 'downloading':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-orange-500';
    }
  };

  const formatDuration = (startTime?: number, endTime?: number) => {
    if (!startTime) return '';
    
    const end = endTime || Date.now();
    const duration = Math.floor((end - startTime) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  const truncateTitle = (title: string, maxLength: number = 30) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Manager
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {activeDownloadCount}/{maxConcurrentDownloads} Active
            </Badge>
            {queueLength > 0 && (
              <Badge variant="secondary" className="text-xs">
                {queueLength} Queued
              </Badge>
            )}
            {(completedDownloads.length > 0 || failedDownloads.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompletedDownloads}
                className="h-6 px-2 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Active Downloads */}
        {activeDownloads.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active Downloads
            </h4>
            {activeDownloads.map((download) => (
              <div key={download.id} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                {getStatusIcon(download.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">
                      {truncateTitle(download.id.split('_')[2] || 'Unknown')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelDownload(download.id)}
                      className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Progress 
                    value={download.progress || 0} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{download.progress || 0}%</span>
                    <span>{formatDuration(download.startTime)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending Downloads */}
        {pendingDownloads.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Pending Downloads
            </h4>
            {pendingDownloads.map((download) => (
              <div key={download.id} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                {getStatusIcon(download.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {truncateTitle(download.id.split('_')[2] || 'Unknown')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelDownload(download.id)}
                      className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Queued • {formatDuration(download.startTime)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed Downloads */}
        {completedDownloads.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Completed Downloads
            </h4>
            {completedDownloads.slice(0, 3).map((download) => (
              <div key={download.id} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                {getStatusIcon(download.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {truncateTitle(download.id.split('_')[2] || 'Unknown')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDuration(download.startTime, download.endTime)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {completedDownloads.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{completedDownloads.length - 3} more completed
              </div>
            )}
          </div>
        )}

        {/* Failed Downloads */}
        {failedDownloads.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Failed Downloads
            </h4>
            {failedDownloads.slice(0, 3).map((download) => (
              <div key={download.id} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                {getStatusIcon(download.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {truncateTitle(download.id.split('_')[2] || 'Unknown')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDuration(download.startTime, download.endTime)}
                    </span>
                  </div>
                  {download.error && (
                    <div className="text-xs text-red-600 mt-1 truncate">
                      {download.error}
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => {
                          if (retryDownload) {
                            retryDownload(download.id);
                          } else {
                            toast({
                              title: "Retry Not Available",
                              description: "Retry function is not implemented.",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {failedDownloads.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{failedDownloads.length - 3} more failed
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 