import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Download, Info } from "lucide-react";
import { MediaPlayer } from "./MediaPlayer";
import { Skeleton } from "@/components/ui/skeleton";

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

export type { Content };

interface ContentSectionProps {
  title: string;
  content: Content[];
  onDownload: (title: string, type: string, downloadUrl?: string) => void;
  showViewAll?: boolean;
  isLoading?: boolean;
}

export const ContentSection = ({ 
  title, 
  content, 
  onDownload, 
  showViewAll = false,
  isLoading = false 
}: ContentSectionProps) => {
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  // Security: Sanitize image URLs to prevent XSS
  const sanitizeImageUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '/placeholder.svg';
      }
      return url;
    } catch {
      return '/placeholder.svg';
    }
  };

  // Skeleton loader for content cards
  const ContentSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="group cursor-pointer">
          <div className="aspect-[2/3] relative mb-4">
            <Skeleton className="w-full h-full" />
          </div>
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {showViewAll && (
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              View All
            </Button>
          )}
        </div>

        {isLoading ? (
          <ContentSkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {content.map((item) => (
              <div key={item.id} className="group cursor-pointer transition-transform duration-200 hover:scale-105">
                <div className="aspect-[2/3] relative">
                  <img
                    src={sanitizeImageUrl(item.image)}
                    alt={item.title}
                    className="w-full h-full object-cover rounded-md"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                    onLoad={(e) => {
                      // Security: Remove any potentially dangerous attributes
                      const target = e.target as HTMLImageElement;
                      target.removeAttribute('onerror');
                      target.removeAttribute('onload');
                    }}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-md">
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="bg-[#E50914] hover:bg-[#B20710] transition-colors duration-200"
                        onClick={() => setSelectedContent(item)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-white text-white hover:bg-white hover:text-black transition-colors duration-200"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (item.downloadUrl) {
                            onDownload(item.title, item.type, item.downloadUrl);
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-[#E50914] text-white text-xs px-2 py-1 rounded font-bold uppercase">
                      {item.type}
                    </span>
                  </div>

                  {/* Year Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {item.year}
                    </span>
                  </div>
                </div>

                <div className="p-2">
                  <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">{item.title}</h3>
                  <p className="text-gray-400 text-xs line-clamp-2">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Player */}
      {selectedContent && (
        <MediaPlayer
          isOpen={!!selectedContent}
          onClose={() => setSelectedContent(null)}
          title={selectedContent.title}
          url={selectedContent.downloadUrl || ''}
          downloadUrl={selectedContent.downloadUrl || ''}
          onDownload={onDownload}
        />
      )}
    </section>
  );
};