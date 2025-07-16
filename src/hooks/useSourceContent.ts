
import React, { useState, useEffect } from 'react';
import { validateUrl, validateSourceName, safeJsonParse } from '@/utils/security';
import { get, set } from '@/utils/storage';

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
  const [error, setError] = useState<string | null>(null);



  // Async storage get/set that works in both Tauri and web
  async function getStoredSources() {
    return await get('streamhaven_sources');
  }

  async function setStoredSources(sources) {
    await set('streamhaven_sources', JSON.stringify(sources));
  }

  // Load sources from Tauri storage with security validation
  useEffect(() => {
    (async () => {
      console.log('Loading sources from Tauri storage...');
      let savedSources: string | null = null;
      try {
        savedSources = await getStoredSources();
      } catch (e) {
        console.error('Failed to get sources from Tauri storage:', e);
      }
      if (savedSources) {
        try {
          const parsed = safeJsonParse(savedSources, []);
          console.log('Parsed saved sources:', parsed);
          // Validate each source for security
          const validSources = parsed
            .filter((source: unknown): source is Source => {
              if (typeof source !== 'object' || source === null) return false;
              const s = source as Partial<Source>;
              if (!s.id || !s.name || !s.url) return false;
              const urlValidation = validateUrl(s.url);
              const nameValidation = validateSourceName(s.name);
              return urlValidation.isValid && nameValidation.isValid;
            })
            .map((source) => ({
              ...source,
              addedAt: typeof source.addedAt === 'string' ? new Date(source.addedAt) : (source.addedAt instanceof Date ? source.addedAt : new Date())
            }));
          console.log('Valid sources after validation:', validSources);
          setSources(validSources);
          // Clean up storage if we removed invalid sources
          if (validSources.length !== parsed.length) {
            await setStoredSources(validSources);
          }
        } catch (error) {
          console.error('Failed to parse saved sources:', error);
          setError('Failed to load saved sources');
          await setStoredSources('');
        }
      } else {
        console.log('No saved sources found');
      }
    })();
  }, []);

  // Generate content when sources change
  useEffect(() => {
    const generateContentFromSources = async () => {
      console.log('generateContentFromSources called, sources:', sources);
      setError(null);
      
      const activeSources = sources.filter(source => source.isActive);
      console.log('Active sources:', activeSources);
      
      if (activeSources.length === 0) {
        console.log('No active sources, setting empty content');
        setContent([]);
        setIsLoading(false);
        return;
      }

      console.log('Starting to generate content for active sources');
      setIsLoading(true);
      
      try {
        const allContent: Content[] = [];
        for (const source of activeSources) {
          console.log(`Fetching content from source: ${source.name} - ${source.url}`);
          try {
            // Use the custom crawler backend for homepage crawling
            const response = await fetch('http://localhost:5002/crawl', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ url: source.url })
            });
            const data = await response.json();
            if (data && typeof data === 'object' && 'error' in data) {
              // If backend returns an error object, set error and skip demo content
              setError(data.error);
              console.error(`Backend error for ${source.name}:`, data.error);
              return;
            }
            if (Array.isArray(data) && data.length > 0) {
              data.forEach((item, index) => {
                if (item.videoUrl) {
                  allContent.push({
                    id: Date.now() + index,
                    title: item.title || `Content ${index + 1}`,
                    year: new Date().getFullYear(),
                    type: 'movie',
                    image: item.image || '/placeholder.svg',
                    description: item.description || 'Extracted by crawler',
                    source: source.name,
                    downloadUrl: item.videoUrl,
                    isLatest: index < 2,
                    isEditorPick: index === 0
                  });
                }
              });
            } else {
              generatePlaceholderContent(source, allContent);
            }
          } catch (fetchError) {
            console.warn(`crawler backend error for ${source.name}:`, fetchError);
            generatePlaceholderContent(source, allContent);
          }
        }
        
        console.log('Final content array:', allContent);
        console.log('Total content items:', allContent.length);
        
        setContent(allContent);
        setIsLoading(false);
        
      } catch (error) {
        console.error('Failed to generate content from sources:', error);
        setError('Failed to load content from sources');
        setContent([]);
        setIsLoading(false);
      }
    };

    generateContentFromSources();
  }, [sources]);

  // Helper function to generate placeholder content when source fails
  const generatePlaceholderContent = (source: Source, allContent: Content[]) => {
    const sourceIndex = allContent.length;
    
    const placeholderMovies = [
      {
        id: Date.now() + sourceIndex * 100 + 1,
        title: `Sample Movie from ${source.name}`,
        year: 2023,
        type: "movie" as const,
        image: "/placeholder.svg",
        description: `Demo content from ${source.name}. This source may be temporarily unavailable.`,
        source: source.name,
        downloadUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        isLatest: sourceIndex === 0
      },
      {
        id: Date.now() + sourceIndex * 100 + 2,
        title: `Demo Series from ${source.name}`,
        year: 2023,
        type: "tv" as const,
        image: "/placeholder.svg",
        description: `Demo TV series from ${source.name}. Check back later for real content.`,
        source: source.name,
        downloadUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        isEditorPick: sourceIndex === 0
      }
    ];
    
    allContent.push(...placeholderMovies);
  };

  const addSource = async (sourceData: Omit<Source, 'id' | 'addedAt'>) => {
    console.log('Adding new source:', sourceData);
    
    // Validate URL and name with security checks
    const urlValidation = validateUrl(sourceData.url);
    const nameValidation = validateSourceName(sourceData.name);
    
    if (!urlValidation.isValid) {
      const errorMsg = urlValidation.error || 'Invalid URL';
      console.error('URL validation failed:', errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!nameValidation.isValid) {
      const errorMsg = nameValidation.error || 'Invalid source name';
      console.error('Name validation failed:', errorMsg);
      throw new Error(errorMsg);
    }

    const newSource: Source = {
      ...sourceData,
      name: nameValidation.sanitizedName!,
      url: urlValidation.sanitizedUrl!,
      id: Date.now().toString(),
      addedAt: new Date()
    };
    
    console.log('Creating new source:', newSource);
    
    const updatedSources = [...sources, newSource];
    setSources(updatedSources);
    
    try {
      await setStoredSources(updatedSources);
      console.log('Successfully saved sources to Tauri storage');
    } catch (error) {
      console.error('Failed to save sources to Tauri storage:', error);
      throw new Error('Failed to save source');
    }
  };

  const removeSource = async (sourceId: string) => {
    console.log('Removing source:', sourceId);
    const updatedSources = sources.filter(source => source.id !== sourceId);
    setSources(updatedSources);
    await setStoredSources(updatedSources);
  };

  const toggleSource = async (sourceId: string) => {
    console.log('Toggling source:', sourceId);
    const updatedSources = sources.map(source => 
      source.id === sourceId ? { ...source, isActive: !source.isActive } : source
    );
    setSources(updatedSources);
    await setStoredSources(updatedSources);
  };

  return {
    sources,
    content,
    isLoading,
    error,
    addSource,
    removeSource,
    toggleSource
  };
};

// Recommended streaming sources from FMHY (July 2025)
export const RECOMMENDED_SOURCES = [
  { name: 'LookMovie', url: 'https://lookmovie2.to/' },
  { name: 'MovieWeb', url: 'https://movieweb.site/' },
  { name: 'Bflix', url: 'https://bflix.gg/' },
  { name: 'Soap2Day', url: 'https://soap2day.rs/' },
];

function extractVideoLinksFromHtml(html: string): Array<{ url: string; title?: string }> {
  // 1. Regex for direct video file links
  const videoRegex = /https?:\/\/[\w\-./?%&=:#+]+\.(mp4|webm|mkv|mov|avi)(\?[^"'\s>]*)?/gi;
  const matches = html.match(videoRegex) || [];
  const results = matches.map(url => ({ url }));

  // 2. Extract from <video> and <source> tags
  const videoTagRegex = /<video[^>]*src=["']([^"'>]+)["'][^>]*>/gi;
  let match;
  while ((match = videoTagRegex.exec(html)) !== null) {
    results.push({ url: match[1] });
  }
  const sourceTagRegex = /<source[^>]*src=["']([^"'>]+)["'][^>]*>/gi;
  while ((match = sourceTagRegex.exec(html)) !== null) {
    results.push({ url: match[1] });
  }

  // 3. Try to extract from common streaming embed patterns (e.g., data-video, data-src)
  const dataSrcRegex = /data-(video|src)=["']([^"'>]+)["']/gi;
  while ((match = dataSrcRegex.exec(html)) !== null) {
    results.push({ url: match[2] });
  }

  // Remove duplicates
  const unique = Array.from(new Set(results.map(v => v.url))).map(url => ({ url }));
  return unique;
}
