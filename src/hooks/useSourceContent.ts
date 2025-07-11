
import { useState, useEffect } from 'react';
import { validateUrl, validateSourceName, safeJsonParse } from '@/utils/security';

interface Content {
  id: number;
  title: string;
  year: number;
  type: 'movie' | 'tv';
  image: string;
  description: string;
  source: string;
  downloadUrl?: string;
  isLatest?: boolean;
  isEditorPick?: boolean;
}

interface Source {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  addedAt: Date;
}

export const useSourceContent = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load sources from localStorage with security validation
  useEffect(() => {
    const savedSources = localStorage.getItem('streamhaven_sources');
    if (savedSources) {
      try {
        const parsed = safeJsonParse(savedSources, []);
        
        // Validate each source for security
        const validSources = parsed
          .filter((source: any) => {
            if (!source || typeof source !== 'object') return false;
            if (!source.id || !source.name || !source.url) return false;
            
            const urlValidation = validateUrl(source.url);
            const nameValidation = validateSourceName(source.name);
            
            return urlValidation.isValid && nameValidation.isValid;
          })
          .map((source: any) => ({
            ...source,
            addedAt: new Date(source.addedAt || Date.now())
          }));
        
        setSources(validSources);
        
        // Clean up localStorage if we removed invalid sources
        if (validSources.length !== parsed.length) {
          localStorage.setItem('streamhaven_sources', JSON.stringify(validSources));
        }
      } catch (error) {
        console.error('Failed to parse saved sources:', error);
        localStorage.removeItem('streamhaven_sources');
      }
    }
  }, []);

  // Fetch content when sources change
  useEffect(() => {
    const fetchContentFromSources = async () => {
      const activeSources = sources.filter(source => source.isActive);
      
      if (activeSources.length === 0) {
        setContent([]);
        return;
      }

      setIsLoading(true);
      try {
        // Generate realistic content for each active source
        const allContent: Content[] = [];
        
        activeSources.forEach((source, sourceIndex) => {
          // Generate movies with working demo streams
          const movies = [
            {
              id: sourceIndex * 1000 + 1,
              title: "Big Buck Bunny",
              year: 2008,
              type: "movie" as const,
              image: "https://images.unsplash.com/photo-1489599117333-089b9c5a56a4?w=400&h=600&fit=crop",
              description: "A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.",
              source: source.name,
              downloadUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
              isLatest: sourceIndex === 0
            },
            {
              id: sourceIndex * 1000 + 2,
              title: "Elephant Dream",
              year: 2006,
              type: "movie" as const,
              image: "https://images.unsplash.com/photo-1489599117333-089b9c5a56a4?w=400&h=600&fit=crop",
              description: "Friends Proog and Emo journey inside the folds of a seemingly infinite Machine, exploring the dark and twisted complex of wires, gears, and cogs.",
              source: source.name,
              downloadUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
              isEditorPick: sourceIndex === 0
            },
            {
              id: sourceIndex * 1000 + 3,
              title: "Sintel",
              year: 2010,
              type: "movie" as const,
              image: "https://images.unsplash.com/photo-1489599117333-089b9c5a56a4?w=400&h=600&fit=crop",
              description: "A lonely young woman, Sintel, helps and befriends a dragon, whom she calls Scales.",
              source: source.name,
              downloadUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
            },
            {
              id: sourceIndex * 1000 + 4,
              title: "Tears of Steel",
              year: 2012,
              type: "movie" as const,
              image: "https://images.unsplash.com/photo-1489599117333-089b9c5a56a4?w=400&h=600&fit=crop",
              description: "In an apocalyptic future, a group of soldiers and scientists takes refuge in Amsterdam to try to stop an army of robots.",
              source: source.name,
              downloadUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
            }
          ];

          // Generate TV shows with working demo streams
          const tvShows = [
            {
              id: sourceIndex * 1000 + 101,
              title: "Sample Series Episode 1",
              year: 2023,
              type: "tv" as const,
              image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
              description: "A demonstration episode showcasing video streaming capabilities in the desktop application.",
              source: source.name,
              downloadUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
              isLatest: sourceIndex === 0
            },
            {
              id: sourceIndex * 1000 + 102,
              title: "Tech Demo Series",
              year: 2022,
              type: "tv" as const,
              image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
              description: "Technical demonstration of media streaming and download functionality.",
              source: source.name,
              downloadUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
              isEditorPick: sourceIndex === 0
            },
            {
              id: sourceIndex * 1000 + 103,
              title: "Demo Content Hub",
              year: 2021,
              type: "tv" as const,
              image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
              description: "Sample content to showcase the media player and download capabilities.",
              source: source.name,
              downloadUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4"
            }
          ];

          allContent.push(...movies, ...tvShows);
        });
        
        setContent(allContent);
      } catch (error) {
        console.error('Failed to fetch content from sources:', error);
        setContent([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentFromSources();
  }, [sources]);

  const addSource = (sourceData: Omit<Source, 'id' | 'addedAt'>) => {
    // Validate URL and name with security checks
    const urlValidation = validateUrl(sourceData.url);
    const nameValidation = validateSourceName(sourceData.name);
    
    if (!urlValidation.isValid) {
      throw new Error(urlValidation.error || 'Invalid URL');
    }
    
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error || 'Invalid source name');
    }

    const newSource: Source = {
      ...sourceData,
      name: nameValidation.sanitizedName!,
      url: urlValidation.sanitizedUrl!,
      id: Date.now().toString(),
      addedAt: new Date()
    };
    
    const updatedSources = [...sources, newSource];
    setSources(updatedSources);
    
    try {
      localStorage.setItem('streamhaven_sources', JSON.stringify(updatedSources));
    } catch (error) {
      console.error('Failed to save sources to localStorage:', error);
      throw new Error('Failed to save source');
    }
  };

  const removeSource = (sourceId: string) => {
    const updatedSources = sources.filter(source => source.id !== sourceId);
    setSources(updatedSources);
    localStorage.setItem('streamhaven_sources', JSON.stringify(updatedSources));
  };

  const toggleSource = (sourceId: string) => {
    const updatedSources = sources.map(source => 
      source.id === sourceId ? { ...source, isActive: !source.isActive } : source
    );
    setSources(updatedSources);
    localStorage.setItem('streamhaven_sources', JSON.stringify(updatedSources));
  };

  return {
    sources,
    content,
    isLoading,
    addSource,
    removeSource,
    toggleSource
  };
};
