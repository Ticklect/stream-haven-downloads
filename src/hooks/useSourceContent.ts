
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { validateUrl } from '../utils/security';
import { get, set, remove } from '../utils/storage';

export interface Source {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  lastCrawled?: string;
  errorCount: number;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  image: string;
  videoUrl: string;
  type: string;
  source: string;
}

const STORAGE_KEY = 'stream_sources';
const BACKEND_URL = '/api';

// Real backend API calls
const fetchContentFromBackend = async (url: string): Promise<ContentItem[]> => {
  try {
    console.log('Fetching content from real backend:', url);
    
    const response = await fetch(`${BACKEND_URL}/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from backend');
    }

    console.log(`Backend returned ${data.length} content items`);
    return data;
  } catch (error) {
    console.error('Backend fetch error:', error);
    throw error;
  }
};

// Check if backend is available
const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
};

export const useSourceContent = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Load sources from storage
  const loadSources = useCallback(async () => {
    try {
      const stored = await get(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSources(parsed);
          return;
        }
      }
      setSources([]);
    } catch (error) {
      console.error('Failed to load sources:', error);
      setSources([]);
    }
  }, []);

  // Save sources to storage
  const saveSources = useCallback(async (newSources: Source[]) => {
    try {
      await set(STORAGE_KEY, JSON.stringify(newSources));
      setSources(newSources);
    } catch (error) {
      console.error('Failed to save sources:', error);
      throw error;
    }
  }, []);

  // Add a new source
  const addSource = useCallback(async (name: string, url: string) => {
    try {
      // Validate input
      const urlValidation = validateUrl(url);
      if (!urlValidation.isValid) {
        throw new Error(urlValidation.error || 'Invalid URL');
      }

      const newSource: Source = {
        id: Date.now().toString(),
        name: name.trim(),
        url: urlValidation.sanitizedUrl || url,
        enabled: true,
        errorCount: 0,
      };

      const updatedSources = [...sources, newSource];
      await saveSources(updatedSources);
      
      // Invalidate content queries to refresh
      queryClient.invalidateQueries({ queryKey: ['sourceContent'] });
      
      return newSource;
    } catch (error) {
      console.error('Failed to add source:', error);
      throw error;
    }
  }, [sources, saveSources, queryClient]);

  // Remove a source
  const removeSource = useCallback(async (id: string) => {
    try {
      const updatedSources = sources.filter(source => source.id !== id);
      await saveSources(updatedSources);
      
      // Invalidate content queries
      queryClient.invalidateQueries({ queryKey: ['sourceContent'] });
    } catch (error) {
      console.error('Failed to remove source:', error);
      throw error;
    }
  }, [sources, saveSources, queryClient]);

  // Toggle source enabled state
  const toggleSource = useCallback(async (id: string) => {
    try {
      const updatedSources = sources.map(source =>
        source.id === id ? { ...source, enabled: !source.enabled } : source
      );
      await saveSources(updatedSources);
      
      // Invalidate content queries
      queryClient.invalidateQueries({ queryKey: ['sourceContent'] });
    } catch (error) {
      console.error('Failed to toggle source:', error);
      throw error;
    }
  }, [sources, saveSources, queryClient]);

  // Generate content from all enabled sources
  const generateContentFromSources = useCallback(async (): Promise<ContentItem[]> => {
    const enabledSources = sources.filter(source => source.enabled);
    
    if (enabledSources.length === 0) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if backend is available
      const backendAvailable = await checkBackendHealth();
      if (!backendAvailable) {
        throw new Error('Backend server is not available. Please start the backend server.');
      }

      const allContent: ContentItem[] = [];
      const errors: string[] = [];

      // Process each source
      for (const source of enabledSources) {
        try {
          console.log(`Processing source: ${source.name} (${source.url})`);
          
          const content = await fetchContentFromBackend(source.url);
          
          if (content && content.length > 0) {
            allContent.push(...content);
            
            // Update source with success
            const updatedSources = sources.map(s =>
              s.id === source.id 
                ? { ...s, lastCrawled: new Date().toISOString(), errorCount: 0 }
                : s
            );
            await saveSources(updatedSources);
          } else {
            console.warn(`No content found for source: ${source.name}`);
            errors.push(`No content found for ${source.name}`);
          }
        } catch (sourceError) {
          console.error(`Error processing source ${source.name}:`, sourceError);
          errors.push(`${source.name}: ${sourceError instanceof Error ? sourceError.message : 'Unknown error'}`);
          
          // Update source with error count
          const updatedSources = sources.map(s =>
            s.id === source.id 
              ? { ...s, errorCount: s.errorCount + 1 }
              : s
          );
          await saveSources(updatedSources);
        }
      }

      if (allContent.length === 0) {
        if (errors.length > 0) {
          throw new Error(`Failed to fetch content from all sources:\n${errors.join('\n')}`);
        } else {
          throw new Error('No content found from any sources');
        }
      }

      console.log(`Successfully generated ${allContent.length} content items`);
      return allContent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Content generation failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sources, saveSources]);

  // React Query for content
  const contentQuery = useQuery({
    queryKey: ['sourceContent'],
    queryFn: generateContentFromSources,
    enabled: sources.filter(s => s.enabled).length > 0,
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Load sources on mount
  useEffect(() => {
    loadSources();
  }, [loadSources]);

  return {
    sources,
    content: contentQuery.data || [],
    isLoading: isLoading || contentQuery.isLoading,
    error: error || contentQuery.error?.message || null,
    addSource,
    removeSource,
    toggleSource,
    refreshContent: () => contentQuery.refetch(),
    backendAvailable: checkBackendHealth,
  };
};

export const RECOMMENDED_SOURCES = [
  { name: 'LookMovie', url: 'https://lookmovie2.to/' },
  { name: 'Bflix', url: 'https://bflix.gg/' },
  { name: 'Soap2Day', url: 'https://soap2day.rs/' },
  { name: 'Sflix', url: 'https://sflix.to/' },
];
