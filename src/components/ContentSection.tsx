import React, { useState } from 'react';
import { Download, Play, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaPlayer } from "@/components/MediaPlayer";

interface Content {
  id: number;
  title: string;
  year: number;
  type: 'movie' | 'tv';
  image: string;
  description: string;
  downloadUrl?: string;
}

interface ContentSectionProps {
  title: string;
  content: Content[];
  onDownload: (title: string, type: string, downloadUrl?: string) => void;
  showViewAll?: boolean;
}

export const ContentSection = ({ title, content, onDownload, showViewAll }: ContentSectionProps) => {
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
          {showViewAll && (
            <Button variant="ghost" className="text-[#E50914] hover:text-white hover:bg-[#E50914]">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {content.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-lg bg-gray-900 hover:scale-105 transition-transform duration-300">
              <div className="aspect-[2/3] relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="bg-[#E50914] hover:bg-[#B20710]"
                      onClick={() => setSelectedContent(item)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-white text-white hover:bg-white hover:text-black"
                      onClick={() => onDownload(item.title, item.type, item.downloadUrl)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                      <Info className="h-4 w-4" />
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

              <div className="p-4">
                <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">{item.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Media Player */}
      {selectedContent && (
        <MediaPlayer
          isOpen={!!selectedContent}
          onClose={() => setSelectedContent(null)}
          title={selectedContent.title}
          url={selectedContent.downloadUrl || ''}
          downloadUrl={selectedContent.downloadUrl}
          onDownload={onDownload}
        />
      )}
    </section>
  );
};