
import { useState, useEffect } from 'react';

interface Content {
  id: number;
  title: string;
  year: number;
  type: string;
  image: string;
  description: string;
  source: string;
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

  // Load sources from localStorage
  useEffect(() => {
    const savedSources = localStorage.getItem('streamhaven_sources');
    if (savedSources) {
      setSources(JSON.parse(savedSources));
    }
  }, []);

  // Fetch content when sources change
  useEffect(() => {
    const fetchContentFromSources = async () => {
      if (sources.length === 0) {
        setContent([]);
        return;
      }

      setIsLoading(true);
      try {
        // Simulate fetching content from external sources
        // In a real implementation, this would make API calls to the sources
        const mockContent: Content[] = sources.flatMap((source, sourceIndex) => [
          {
            id: sourceIndex * 100 + 1,
            title: `Featured Movie from ${source.name}`,
            year: 2025,
            type: "movie",
            image: "https://images.unsplash.com/photo-1489599117333-089b9c5a56a4?w=400&h=600&fit=crop",
            description: "Latest movie from external source",
            source: source.name,
            isLatest: true
          },
          {
            id: sourceIndex * 100 + 2,
            title: `Popular Series from ${source.name}`,
            year: 2025,
            type: "tv",
            image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
            description: "Trending TV show",
            source: source.name,
            isEditorPick: true
          }
        ]);
        
        setContent(mockContent);
      } catch (error) {
        console.error('Failed to fetch content from sources:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentFromSources();
  }, [sources]);

  const addSource = (sourceData: Omit<Source, 'id' | 'addedAt'>) => {
    const newSource: Source = {
      ...sourceData,
      id: Date.now().toString(),
      addedAt: new Date()
    };
    
    const updatedSources = [...sources, newSource];
    setSources(updatedSources);
    localStorage.setItem('streamhaven_sources', JSON.stringify(updatedSources));
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
