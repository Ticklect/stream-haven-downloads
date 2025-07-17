
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ContentSection } from "@/components/ContentSection";
import { EmptyState } from "@/components/EmptyState";
import { DownloadStatus } from "@/components/DownloadStatus";
import { ErrorHandler } from "@/components/ErrorHandler";
import { useToast } from "@/hooks/use-toast";
import { useSourceContent } from "@/hooks/useSourceContent";
import { useDownloadManager } from "@/hooks/useDownloadManager";

const Index = () => {
  const { toast } = useToast();
  const { sources, content, isLoading, error } = useSourceContent();
  const { startDownload } = useDownloadManager();

  console.log('Index render - Sources:', sources.length, 'Content:', content.length, 'Loading:', isLoading, 'Error:', error);

  const handleDownload = async (title: string, type: string, downloadUrl?: string) => {
    console.log('Download requested for:', title, 'URL:', downloadUrl);
    
    if (!downloadUrl) {
      toast({
        title: "Download Unavailable",
        description: "No download link available for this content",
        variant: "destructive"
      });
      return;
    }

    // Show confirmation dialog for external downloads
    const confirmDownload = window.confirm(
      `Are you sure you want to download "${title}"?`
    );
    
    if (!confirmDownload) {
      return;
    }

    try {
      console.log('Starting download for:', downloadUrl);
      
      // Use thread-safe download manager
      const downloadId = await startDownload(title, type, downloadUrl);
      
      if (downloadId) {
        toast({
          title: "Download Queued",
          description: `${title} has been added to the download queue`,
        });
      } else {
        throw new Error('Failed to queue download');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Unable to start download. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter content by type
  const latestReleases = content.filter(item => item.isLatest).slice(0, 4);
  const editorPicks = content.filter(item => item.isEditorPick).slice(0, 4);
  const movies = content.filter(item => item.type === "movie");
  const tvShows = content.filter(item => item.type === "tv");

  console.log('Filtered content:', {
    latestReleases: latestReleases.length,
    editorPicks: editorPicks.length,
    movies: movies.length,
    tvShows: tvShows.length
  });

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <HeroSection />
        <main className="pb-16">
          <div className="container mx-auto px-4 py-16 text-center">
            <ErrorHandler
              error={error}
              errorType="source"
              onRetry={() => window.location.reload()}
              showRecoveryOptions={true}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <HeroSection />
      
      <main className="pb-16">
        {/* Download Status Component */}
        <div className="container mx-auto px-4 py-4">
          <DownloadStatus />
        </div>
        
        {sources.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {latestReleases.length > 0 && (
              <ContentSection
                title="Latest Releases"
                content={latestReleases}
                onDownload={handleDownload}
                isLoading={isLoading}
              />
            )}
            
            {editorPicks.length > 0 && (
              <ContentSection
                title="Editor Picks"
                content={editorPicks}
                onDownload={handleDownload}
                isLoading={isLoading}
              />
            )}
            
            {movies.length > 0 && (
              <ContentSection
                title="Movies"
                content={movies}
                onDownload={handleDownload}
                showViewAll
                isLoading={isLoading}
              />
            )}
            
            {tvShows.length > 0 && (
              <ContentSection
                title="TV Shows"
                content={tvShows}
                onDownload={handleDownload}
                showViewAll
                isLoading={isLoading}
              />
            )}

            {/* Show loading state when no content is available yet */}
            {!isLoading && content.length === 0 && sources.length > 0 && (
              <div className="container mx-auto px-4 py-16 text-center">
                <div className="text-gray-400 text-lg">No content available from active sources</div>
                <div className="text-gray-500 text-sm mt-2">
                  Try adding more sources or check if your current sources are active
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
