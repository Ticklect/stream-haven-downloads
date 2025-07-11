
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
          // Generate movies
          const movies = [
            {
              id: sourceIndex * 1000 + 1,
              title: "Avatar: The Way of Water",
              year: 2022,
              type: "movie" as const,
              image: "https://images.unsplash.com/photo-1489599117333-089b9c5a56a4?w=400&h=600&fit=crop",
              description: "Set more than a decade after the events of the first film, Avatar: The Way of Water begins to tell the story of the Sully family.",
              source: source.name,
              downloadUrl: `${source.url}/download/avatar-way-water`,
              isLatest: sourceIndex === 0
            },
            {
              id: sourceIndex * 1000 + 2,
              title: "Top Gun: Maverick",
              year: 2022,
              type: "movie" as const,
              image: "https://images.unsplash.com/photo-1489599117333-089b9c5a56a4?w=400&h=600&fit=crop",
              description: "After thirty years, Maverick is still pushing the envelope as a top naval aviator.",
              source: source.name,
              downloadUrl: `${source.url}/download/top-gun-maverick`,
              isEditorPick: sourceIndex === 0
            },
            {
              id: sourceIndex * 1000 + 3,
              title: "Spider-Man: No Way Home",
              year: 2021,
              type: "movie" as const,
              image: "https://images.unsplash.com/photo-1489599117333-089b9c5a56a4?w=400&h=600&fit=crop",
              description: "Spider-Man's identity is revealed to the entire world.",
              source: source.name,
              downloadUrl: `${source.url}/download/spiderman-no-way-home`
            }
          ];

          // Generate TV shows
          const tvShows = [
            {
              id: sourceIndex * 1000 + 101,
              title: "The Last of Us",
              year: 2023,
              type: "tv" as const,
              image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
              description: "Joel and Ellie, a pair connected through the harshness of the world they live in.",
              source: source.name,
              downloadUrl: `${source.url}/download/last-of-us-s01`,
              isLatest: sourceIndex === 0
            },
            {
              id: sourceIndex * 1000 + 102,
              title: "Wednesday",
              year: 2022,
              type: "tv" as const,
              image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
              description: "Wednesday Addams is sent to Nevermore Academy.",
              source: source.name,
              downloadUrl: `${source.url}/download/wednesday-s01`,
              isEditorPick: sourceIndex === 0
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
