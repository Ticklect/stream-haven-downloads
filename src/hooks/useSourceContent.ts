
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { validateUrl, validateSourceName, safeJsonParse } from '@/utils/security';
import { get, set } from '@/utils/storage';
import { useDebounce } from './use-debounce';

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

interface SourceError {
  sourceId: string;
  error: string;
}

export const useSourceContent = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<SourceError[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Refs for managing async operations and preventing race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const operationIdRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  // Debounce sources to prevent rapid re-fetches
  const debouncedSources = useDebounce(sources, 500);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Async storage get/set that works in both Tauri and web
  const getStoredSources = useCallback(async () => {
    return await get('streamhaven_sources');
  }, []);

  const setStoredSources = useCallback(async (sources: Source[]) => {
    await set('streamhaven_sources', JSON.stringify(sources));
  }, []);

  // Load sources from Tauri storage with security validation
  useEffect(() => {
    const loadSources = async () => {
      if (!isMountedRef.current) return;
      
      console.log('Loading sources from Tauri storage...');
      let savedSources: string | null = null;
      try {
        savedSources = await getStoredSources();
      } catch (e) {
        console.error('Failed to get sources from Tauri storage:', e);
        if (isMountedRef.current) {
          setGlobalError('Failed to load saved sources');
        }
        return;
      }
      
      if (!isMountedRef.current) return;
      
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
            .map((source: any) => ({
              ...source,
              addedAt: typeof source.addedAt === 'string' ? new Date(source.addedAt) : (source.addedAt instanceof Date ? source.addedAt : new Date())
            }));
          console.log('Valid sources after validation:', validSources);
          
          if (isMountedRef.current) {
            setSources(validSources);
            // Clean up storage if we removed invalid sources
            if (validSources.length !== parsed.length) {
              await setStoredSources(validSources);
            }
          }
        } catch (error) {
          console.error('Failed to parse saved sources:', error);
          if (isMountedRef.current) {
            setGlobalError('Failed to load saved sources');
            await setStoredSources([]);
          }
        }
      } else {
        console.log('No saved sources found');
      }
    };

    loadSources();
  }, [getStoredSources, setStoredSources]);

  // Generate content when debounced sources change (prevents rapid re-fetches)
  useEffect(() => {
    const generateContentFromSources = async () => {
      if (!isMountedRef.current) return;
      
      // Cancel any ongoing operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller for this operation
      abortControllerRef.current = new AbortController();
      const currentOperationId = ++operationIdRef.current;
      
      console.log('generateContentFromSources called, sources:', debouncedSources);
      setGlobalError(null);
      setErrors([]);
      
      const activeSources = debouncedSources.filter(source => source.isActive);
      console.log('Active sources:', activeSources);
      
      if (activeSources.length === 0) {
        console.log('No active sources, setting empty content');
        if (isMountedRef.current && currentOperationId === operationIdRef.current) {
          setContent([]);
          setIsLoading(false);
        }
        return;
      }

      console.log('Starting to generate content for active sources');
      if (isMountedRef.current) {
        setIsLoading(true);
      }
      
      try {
        const allContent: Content[] = [];
        const sourceErrors: SourceError[] = [];
        
        // Fetch content from all sources in parallel with individual error handling
        const contentPromises = activeSources.map(async (source) => {
          try {
            console.log(`Fetching content from source: ${source.name} - ${source.url}`);
            const content = await fetchContentFromSource(source, abortControllerRef.current!.signal);
            
            if (content && content.length > 0) {
              console.log(`Successfully fetched ${content.length} items from ${source.name}`);
              return { source, content, error: null };
            } else {
              console.warn(`No content found for ${source.name}, using fallback`);
              const fallbackContent = generatePlaceholderContent(source);
              return { source, content: fallbackContent, error: null };
            }
          } catch (fetchError) {
            console.warn(`Content fetching failed for ${source.name}:`, fetchError);
            const fallbackContent = generatePlaceholderContent(source);
            return { 
              source, 
              content: fallbackContent, 
              error: { sourceId: source.id, error: fetchError instanceof Error ? fetchError.message : 'Unknown error' }
            };
          }
        });
        
        const results = await Promise.allSettled(contentPromises);
        
        // Check if operation was cancelled
        if (!isMountedRef.current || currentOperationId !== operationIdRef.current) {
          return;
        }
        
        // Process results
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { content: sourceContent, error } = result.value;
            allContent.push(...sourceContent);
            if (error) {
              sourceErrors.push(error);
            }
          } else {
            console.error('Source processing failed:', result.reason);
          }
        });
        
        // Show warnings for failed sources but don't block the entire process
        if (sourceErrors.length > 0 && sourceErrors.length === activeSources.length) {
          setGlobalError(`All sources failed: ${sourceErrors.map(e => e.error).join(', ')}`);
        } else if (sourceErrors.length > 0) {
          console.warn('Some sources failed:', sourceErrors);
          setErrors(sourceErrors);
        }
        
        console.log('Final content array:', allContent);
        console.log('Total content items:', allContent.length);
        
        if (isMountedRef.current && currentOperationId === operationIdRef.current) {
          setContent(allContent);
          setIsLoading(false);
        }
        
      } catch (error) {
        console.error('Failed to generate content from sources:', error);
        if (isMountedRef.current && currentOperationId === operationIdRef.current) {
          setGlobalError('Failed to load content from sources');
          setContent([]);
          setIsLoading(false);
        }
      }
    };

    generateContentFromSources();
  }, [debouncedSources]);

  // Enhanced content fetching with multiple fallback strategies and request cancellation
  const fetchContentFromSource = useCallback(async (source: Source, signal: AbortSignal): Promise<Content[]> => {
    const strategies = [
      // Strategy 1: Try crawler backend
      async () => {
        const response = await fetch('http://localhost:5002/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: source.url }),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`Crawler backend failed: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && typeof data === 'object' && 'error' in data) {
          throw new Error(data.error);
        }
        
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('No content returned from crawler');
        }
        
        return data.map((item, index) => ({
          id: Date.now() + index,
          title: item.title || `Content ${index + 1}`,
          year: new Date().getFullYear(),
          type: 'movie' as const,
          image: item.image || '/placeholder.svg',
          description: item.description || 'Extracted by crawler',
          source: source.name,
          downloadUrl: item.videoUrl,
          isLatest: index < 2,
          isEditorPick: index === 0
        })).filter(item => item.downloadUrl);
      },
      
      // Strategy 2: Try direct HTML parsing (fallback)
      async () => {
        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(8000)
        });
        
        if (!response.ok) {
          throw new Error(`Direct fetch failed: ${response.status}`);
        }
        
        const html = await response.text();
        const videoLinks = extractVideoLinksFromHtml(html);
        
        if (videoLinks.length === 0) {
          throw new Error('No video links found in HTML');
        }
        
        return videoLinks.slice(0, 5).map((link, index) => ({
          id: Date.now() + index,
          title: `Content from ${source.name} ${index + 1}`,
          year: new Date().getFullYear(),
          type: 'movie' as const,
          image: '/placeholder.svg',
          description: `Extracted from ${source.name}`,
          source: source.name,
          downloadUrl: link.url,
          isLatest: index < 2,
          isEditorPick: index === 0
        }));
      }
    ];
    
    // Try each strategy in order
    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`Trying content fetching strategy ${i + 1} for ${source.name}`);
        const content = await strategies[i]();
        if (content && content.length > 0) {
          return content;
        }
      } catch (error) {
        console.warn(`Strategy ${i + 1} failed for ${source.name}:`, error instanceof Error ? error.message : error);
        if (i === strategies.length - 1) {
          throw error; // Re-throw if all strategies failed
        }
      }
    }
    
    throw new Error('All content fetching strategies failed');
  }, []);

  // Helper function to generate placeholder content when source fails
  const generatePlaceholderContent = (source: Source) => {
    const sourceIndex = content.length; // Use content length to ensure unique IDs
    
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
    
    return placeholderMovies;
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
    error: globalError, // Renamed from 'error' to 'globalError'
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
