
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Pause, Volume2, VolumeX, Maximize, Download, X, AlertTriangle } from "lucide-react";
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Use the actual URL passed from the content
  const videoUrl = url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    // HLS support
    if (videoUrl.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          setError(null);
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          setError('Failed to load HLS stream.');
          setIsLoading(false);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
      } else {
        setError('HLS is not supported in this browser.');
        setIsLoading(false);
      }
    } else {
      video.src = videoUrl;
    }

    console.log('Setting up video event listeners for:', videoUrl);

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => {
      console.log('Video duration loaded:', video.duration);
      setDuration(video.duration);
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
            errorMessage = "Network error. Check your connection or try a different source.";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Media format not supported by your browser.";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Media source not supported. This might be a CORS issue.";
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

    // Set video properties for better CORS compatibility
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    
    // Handle CORS issues more gracefully
    const originalSrc = video.src;
    const corsProxy = `https://cors-anywhere.herokuapp.com/${videoUrl}`;
    
    // Try original URL first, fallback to CORS proxy
    video.src = videoUrl;

    return () => {
      if (hls) {
        hls.destroy();
      }
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, [url, videoUrl]);

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
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <div className="text-lg font-semibold mb-2">Media Unavailable</div>
                <div className="text-sm opacity-80 mb-4">{error}</div>
                <div className="text-xs opacity-60">
                  This could be due to CORS restrictions, network issues, or the media source being unavailable.
                  Try refreshing or using a different source.
                </div>
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
