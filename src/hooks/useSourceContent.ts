
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
        // Generate content for each active source with proper URLs
        const allContent: Content[] = [];
        
        activeSources.forEach((source, sourceIndex) => {
          console.log(`Generating content for source: ${source.name}`);
          
          // Use accessible demo content with working URLs
          const movies = [
            {
              id: sourceIndex * 1000 + 1,
              title: "Big Buck Bunny",
              year: 2008,
              type: "movie" as const,
              image: "https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217",
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
              image: "https://archive.org/download/ElephantsDream/ElephantsDream.thumbs/Elephants_Dream_1024kb.mp4_000001.jpg",
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
              image: "https://durian.blender.org/wp-content/uploads/2010/06/sintel_poster.jpg",
              description: "A lonely young woman, Sintel, helps and befriends a dragon, whom she calls Scales.",
              source: source.name,
              downloadUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
            },
            {
              id: sourceIndex * 1000 + 4,
              title: "Tears of Steel",
              year: 2012,
              type: "movie" as const,
              image: "https://mango.blender.org/wp-content/uploads/2012/09/TOS-poster-final.png",
              description: "In an apocalyptic future, a group of soldiers and scientists takes refuge in Amsterdam to try to stop an army of robots.",
              source: source.name,
              downloadUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
            }
          ];

          // Generate TV shows with accessible content
          const tvShows = [
            {
              id: sourceIndex * 1000 + 101,
              title: "Sample Video",
              year: 2023,
              type: "tv" as const,
              image: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
              description: "A high-quality sample video for testing streaming capabilities.",
              source: source.name,
              downloadUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
              isLatest: sourceIndex === 1
            },
            {
              id: sourceIndex * 1000 + 102,
              title: "Demo Content",
              year: 2022,
              type: "tv" as const,
              image: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg",
              description: "Demo video content for streaming platform testing.",
              source: source.name,
              downloadUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
              isEditorPick: sourceIndex === 1
            }
          ];

          allContent.push(...movies, ...tvShows);
        });
        
        console.log('Generated content array:', allContent);
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
