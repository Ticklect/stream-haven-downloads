
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ContentSection } from "@/components/ContentSection";
import type { Content } from "@/components/ContentSection";
import { EmptyState } from "@/components/EmptyState";
import { DownloadStatus } from "@/components/DownloadStatus";
import { ErrorHandler } from "@/components/ErrorHandler";
import { useToast } from "@/hooks/use-toast";
import { useSourceContent } from "@/hooks/useSourceContent";
import { useDownloadManager } from "@/hooks/useDownloadManager";

// Replace all 'any' with a specific ContentItem type
interface ContentItem {
  id: string;
  title: string;
  description: string;
  image: string;
  videoUrl: string;
  type: string;
  source: string;
  year?: number;
  isLatest?: boolean;
  isEditorPick?: boolean;
}

const Index = () => {
  const { toast } = useToast();
  const { sources, content, isLoading, error } = useSourceContent();
  const { startDownload } = useDownloadManager();

  console.log('Index render - Sources:', sources.length, 'Content:', content.length, 'Loading:', isLoading, 'Error:', error);

  const handleDownload = async (title: string, type: string, downloadUrl?: string) => {
    console.log('Download requested for:', title, 'URL:', downloadUrl);
    
    if (!downloadUrl) {
      toast('Download Unavailable: No download link available for this content');
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

  // Add type guard for ContentItem
  function isLatest(item: ContentItem): boolean {
    return !!item.isLatest;
  }
  function isEditorPick(item: ContentItem): boolean {
    return !!item.isEditorPick;
  }
  function hasYear(item: ContentItem): boolean {
    return typeof item.year === 'number';
  }

  // Filter content by type
  const latestReleases = content.filter(isLatest).slice(0, 4);
  const editorPicks = content.filter(isEditorPick).slice(0, 4);
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

  // Fix all toast usages:
  // toast('Download Unavailable: No download link available for this content');
  // toast('Download Queued: ...');
  // toast.error('Download Failed: ...');

  // Fix ContentSection content prop:
  // Ensure all items have a year property
  // If Content expects id: number, convert id to number
  // Ensure all required Content properties are present
  const ensureYear = (item: ContentItem): Content => ({
    ...item,
    year: typeof item.year === 'number' ? item.year : 0,
    id: Number(item.id)
  });

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
                content={latestReleases.map(ensureYear)}
                onDownload={handleDownload}
                isLoading={isLoading}
              />
            )}
            
            {editorPicks.length > 0 && (
              <ContentSection
                title="Editor Picks"
                content={editorPicks.map(ensureYear)}
                onDownload={handleDownload}
                isLoading={isLoading}
              />
            )}
            
            {movies.length > 0 && (
              <ContentSection
                title="Movies"
                content={movies.map(ensureYear)}
                onDownload={handleDownload}
                showViewAll
                isLoading={isLoading}
              />
            )}
            
            {tvShows.length > 0 && (
              <ContentSection
                title="TV Shows"
                content={tvShows.map(ensureYear)}
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
