
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
  const [error, setError] = useState<string | null>(null);

  // Load sources from localStorage with security validation
  useEffect(() => {
    console.log('Loading sources from localStorage...');
    const savedSources = localStorage.getItem('streamhaven_sources');
    if (savedSources) {
      try {
        const parsed = safeJsonParse(savedSources, []);
        console.log('Parsed saved sources:', parsed);
        
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
        
        console.log('Valid sources after validation:', validSources);
        setSources(validSources);
        
        // Clean up localStorage if we removed invalid sources
        if (validSources.length !== parsed.length) {
          localStorage.setItem('streamhaven_sources', JSON.stringify(validSources));
        }
      } catch (error) {
        console.error('Failed to parse saved sources:', error);
        setError('Failed to load saved sources');
        localStorage.removeItem('streamhaven_sources');
      }
    } else {
      console.log('No saved sources found');
    }
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
        // Try to fetch content from actual sources
        const allContent: Content[] = [];
        
        for (const source of activeSources) {
          console.log(`Fetching content from source: ${source.name} - ${source.url}`);
          
          try {
            // Try to fetch from the actual source
            const response = await fetch(source.url, {
              method: 'GET',
              headers: {
                'Accept': 'application/json, text/html',
                'User-Agent': 'StreamHaven/1.0'
              },
              mode: 'cors'
            });
            
            if (response.ok) {
              const data = await response.text();
              console.log(`Successfully fetched from ${source.name}, data length:`, data.length);
              
              // Try to parse as JSON first
              try {
                const jsonData = JSON.parse(data);
                if (Array.isArray(jsonData)) {
                  // If it's an array of content, add it
                  jsonData.forEach((item: any, index: number) => {
                    if (item.title && item.type) {
                      allContent.push({
                        id: Date.now() + index,
                        title: item.title || `Content ${index + 1}`,
                        year: item.year || new Date().getFullYear(),
                        type: item.type === 'tv' ? 'tv' : 'movie',
                        image: item.image || '/placeholder.svg',
                        description: item.description || 'No description available',
                        source: source.name,
                        downloadUrl: item.downloadUrl || item.url,
                        isLatest: index < 2,
                        isEditorPick: index === 0
                      });
                    }
                  });
                }
              } catch {
                // If not JSON, generate placeholder content for this source
                console.log(`${source.name} returned HTML/text, generating placeholder content`);
                generatePlaceholderContent(source, allContent);
              }
            } else {
              console.warn(`Failed to fetch from ${source.name}:`, response.status, response.statusText);
              generatePlaceholderContent(source, allContent);
            }
          } catch (fetchError) {
            console.warn(`Network error fetching from ${source.name}:`, fetchError);
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

  const addSource = (sourceData: Omit<Source, 'id' | 'addedAt'>) => {
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
      localStorage.setItem('streamhaven_sources', JSON.stringify(updatedSources));
      console.log('Successfully saved sources to localStorage');
    } catch (error) {
      console.error('Failed to save sources to localStorage:', error);
      throw new Error('Failed to save source');
    }
  };

  const removeSource = (sourceId: string) => {
    console.log('Removing source:', sourceId);
    const updatedSources = sources.filter(source => source.id !== sourceId);
    setSources(updatedSources);
    localStorage.setItem('streamhaven_sources', JSON.stringify(updatedSources));
  };

  const toggleSource = (sourceId: string) => {
    console.log('Toggling source:', sourceId);
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
    error,
    addSource,
    removeSource,
    toggleSource
  };
};
