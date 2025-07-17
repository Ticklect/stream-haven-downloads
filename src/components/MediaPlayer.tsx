
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Pause, Volume2, VolumeX, Maximize, Download, X, AlertTriangle, RefreshCw, Settings } from "lucide-react";
import { ErrorHandler } from "@/components/ErrorHandler";
import { useToast } from "@/hooks/use-toast";
import Hls from 'hls.js';

interface MediaPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  downloadUrl?: string;
  onDownload?: (title: string, type: string, downloadUrl?: string) => void;
}

export const MediaPlayer = ({ 
  isOpen, 
  onClose, 
  title, 
  url, 
  downloadUrl,
  onDownload 
}: MediaPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const { toast } = useToast();

  // Constants for loading management
  const MAX_RETRY_ATTEMPTS = 3;
  const LOAD_TIMEOUT_MS = 30000; // 30 seconds
  const RETRY_DELAY_MS = 2000; // 2 seconds

  // Use the actual URL passed from the content
  const videoUrl = url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  // Generate multiple source URLs for fallback
  const getVideoSources = useCallback(() => {
    const sources = [];
    
    // Original URL
    if (videoUrl) {
      sources.push(videoUrl);
    }
    
    // CORS proxy fallbacks (multiple options for reliability)
    const corsProxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(videoUrl)}`,
      `https://cors-anywhere.herokuapp.com/${videoUrl}`,
      `https://thingproxy.freeboard.io/fetch/${videoUrl}`,
      `https://corsproxy.io/?${encodeURIComponent(videoUrl)}`
    ];
    
    sources.push(...corsProxies);
    
    return sources;
  }, [videoUrl]);

  // Clear load timeout
  const clearLoadTimeout = useCallback(() => {
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      setLoadTimeout(null);
    }
  }, [loadTimeout]);

  // Set load timeout
  const setLoadTimeoutHandler = useCallback((sourceIndex: number) => {
    clearLoadTimeout();
    const timeout = setTimeout(() => {
      console.warn('Video load timeout, trying next source');
      setError('Loading timeout - trying alternative source');
      // Will be handled by the loadVideoSource function
    }, LOAD_TIMEOUT_MS);
    setLoadTimeout(timeout);
  }, [clearLoadTimeout]);

  // Load video with fallback sources and timeout handling
  const loadVideoSource = useCallback(async (sourceIndex: number = 0) => {
    const video = videoRef.current;
    if (!video) return;

    const sources = getVideoSources();
    if (sourceIndex >= sources.length) {
      setError("All video sources failed to load. Please try again later.");
      setIsLoading(false);
      setIsRetrying(false);
      setRetryCount(0);
      clearLoadTimeout();
      return;
    }

    const currentSource = sources[sourceIndex];
    console.log(`Attempting to load video source ${sourceIndex + 1}/${sources.length}:`, currentSource);

    try {
      setIsLoading(true);
      setError(null);
      setCurrentSourceIndex(sourceIndex);
      setLoadTimeoutHandler(sourceIndex);

      // Clean up previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // Check if it's an HLS stream
      if (currentSource.includes('.m3u8') || currentSource.includes('application/x-mpegURL')) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
            maxLoadingDelay: 10, // 10 seconds max loading delay
            maxBufferLength: 30, // 30 seconds max buffer
            maxMaxBufferLength: 60 // 60 seconds absolute max
          });
          
          hls.loadSource(currentSource);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS manifest parsed successfully');
            setIsLoading(false);
            setError(null);
            clearLoadTimeout();
          });
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error:', data);
            if (data.fatal) {
              hls.destroy();
              clearLoadTimeout();
              // Retry with next source
              setTimeout(() => {
                loadVideoSource(sourceIndex + 1);
              }, RETRY_DELAY_MS);
            }
          });
          
          hlsRef.current = hls;
        } else {
          // Fallback for browsers without HLS support
          console.log('HLS not supported, trying direct source');
          video.src = currentSource;
        }
      } else {
        // Regular video source
        video.src = currentSource;
      }

      // Set video properties for better CORS compatibility
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      
    } catch (error) {
      console.error('Error loading video source:', error);
      clearLoadTimeout();
      // Retry with next source
      setTimeout(() => {
        loadVideoSource(sourceIndex + 1);
      }, RETRY_DELAY_MS);
    }
  }, [videoUrl, getVideoSources, setLoadTimeoutHandler, clearLoadTimeout]);

  // Handle retry with exponential backoff
  const handleRetry = useCallback(() => {
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      setError('Maximum retry attempts reached. Please try again later.');
      setIsRetrying(false);
      setRetryCount(0);
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    // Exponential backoff: 2s, 4s, 8s
    const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
    
    setTimeout(() => {
      loadVideoSource(0); // Start from first source
    }, delay);
  }, [retryCount, loadVideoSource]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => {
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };
    const handleLoadStart = () => {
      console.log('Video load started');
      setIsLoading(true);
      setError(null);
    };
    const handleCanPlay = () => {
      console.log('Video can play');
      setIsLoading(false);
      setError(null);
    };
    const handleError = (e: Event) => {
      console.error('Video error occurred:', e);
      const videoElement = e.target as HTMLVideoElement;
      let errorMessage = "Failed to load media.";
      
      if (videoElement?.error) {
        console.error('Video error details:', {
          code: videoElement.error.code,
          message: videoElement.error.message
        });
        
        switch (videoElement.error.code) {
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "Network error. Trying alternative sources...";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Media format not supported. Trying alternative sources...";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Media source not supported. Trying alternative sources...";
            break;
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Media loading was aborted.";
            break;
          default:
            errorMessage = "Unknown media error occurred.";
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
      
      // Try next source after a short delay
      setTimeout(() => {
        loadVideoSource(currentSourceIndex + 1);
      }, 1000);
    };
    const handleLoadedData = () => {
      console.log('Video data loaded successfully');
      setIsLoading(false);
      setError(null);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    // Load initial video source
    loadVideoSource();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, [url, videoUrl, loadVideoSource, currentSourceIndex]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video || error) return;

    try {
      if (!hasInteracted) {
        setHasInteracted(true);
      }

      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        console.log('Attempting to play video...');
        await video.play();
        setIsPlaying(true);
        console.log('Video playing successfully');
      }
    } catch (err) {
      console.error('Playback error:', err);
      toast({
        title: "Playback Error",
        description: "Unable to play this media. The source might be unavailable or blocked by CORS.",
        variant: "destructive"
      });
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration || error) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const handleDownload = () => {
    if (onDownload && downloadUrl) {
      onDownload(title, "video", downloadUrl);
    } else {
      toast({
        title: "Download Unavailable",
        description: "No download link available for this content",
        variant: "destructive"
      });
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[80vh] p-0">
        <div ref={containerRef} className="relative w-full h-full bg-black rounded-lg overflow-hidden">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white text-lg font-semibold truncate">
                {title}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            src={videoUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
            controls={false}
          >
            <track kind="captions" />
          </video>

          {/* Loading Overlay */}
          {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-lg">Loading media...</div>
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center text-white p-6 max-w-md">
                <ErrorHandler
                  error={error}
                  errorType="media"
                  onRetry={() => loadVideoSource(0)}
                  onAlternativeAction={() => loadVideoSource(currentSourceIndex + 1)}
                  showRecoveryOptions={true}
                />
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div 
              className="w-full h-2 bg-white/20 rounded-full mb-4 cursor-pointer"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-primary rounded-full transition-all duration-200"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                  disabled={!!error}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                  disabled={!!error}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>

                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {downloadUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
