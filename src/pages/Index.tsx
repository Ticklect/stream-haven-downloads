
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ContentSection } from "@/components/ContentSection";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { useSourceContent } from "@/hooks/useSourceContent";

const Index = () => {
  const { toast } = useToast();
  const { sources, content, isLoading } = useSourceContent();

  const handleDownload = (title: string, type: string) => {
    toast({
      title: "Download Started",
      description: `${title} is now downloading in HD quality`,
    });
  };

  // Filter content by type
  const latestReleases = content.filter(item => item.isLatest).slice(0, 4);
  const editorPicks = content.filter(item => item.isEditorPick).slice(0, 4);
  const movies = content.filter(item => item.type === "movie");
  const tvShows = content.filter(item => item.type === "tv");

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <HeroSection />
      
      <main className="pb-16">
        {sources.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {latestReleases.length > 0 && (
              <ContentSection
                title="Latest Releases"
                content={latestReleases}
                onDownload={handleDownload}
              />
            )}
            
            {editorPicks.length > 0 && (
              <ContentSection
                title="Editor Picks"
                content={editorPicks}
                onDownload={handleDownload}
              />
            )}
            
            {movies.length > 0 && (
              <ContentSection
                title="Movies"
                content={movies}
                onDownload={handleDownload}
                showViewAll
              />
            )}
            
            {tvShows.length > 0 && (
              <ContentSection
                title="TV Shows"
                content={tvShows}
                onDownload={handleDownload}
                showViewAll
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
