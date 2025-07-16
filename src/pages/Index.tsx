
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ContentSection } from "@/components/ContentSection";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { useSourceContent } from "@/hooks/useSourceContent";
import { validateDownloadUrl, createSecureFilename } from "@/utils/security";

const Index = () => {
  const { toast } = useToast();
  const { sources, content, isLoading, error } = useSourceContent();

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

    // Validate download URL for security
    const urlValidation = validateDownloadUrl(downloadUrl);
    if (!urlValidation.isValid) {
      console.error('Download URL validation failed:', urlValidation.error);
      toast({
        title: "Security Error",
        description: urlValidation.error || "Invalid download URL",
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
      
      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = createSecureFilename(title, type);
      link.rel = 'noopener noreferrer';
      link.target = '_blank';
      
      // Add to DOM, click, then remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `${title} download initiated`,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Unable to start download. Please try again.",
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
            <div className="text-red-500 text-lg mb-4">Error Loading Content</div>
            <div className="text-gray-400">{error}</div>
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
        {sources.length === 0 ? (
          <EmptyState />
        ) : isLoading ? (
          <div className="container mx-auto px-4 py-16 text-center">
            <div className="text-white text-lg">Loading content from sources...</div>
          </div>
        ) : content.length === 0 ? (
          <div className="container mx-auto px-4 py-16 text-center">
            <div className="text-gray-400 text-lg">No content available from active sources</div>
            <div className="text-gray-500 text-sm mt-2">
              Try adding more sources or check if your current sources are active
            </div>
          </div>
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
