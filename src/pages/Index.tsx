
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ContentSection } from "@/components/ContentSection";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();

  const latestReleases = [
    {
      id: 1,
      title: "The Dark Knight Rises",
      year: 2025,
      type: "movie",
      image: "https://images.unsplash.com/photo-1489599117333-089b9c5a56a4?w=400&h=600&fit=crop",
      description: "Epic superhero conclusion"
    },
    {
      id: 2,
      title: "Stranger Things 5",
      year: 2025,
      type: "tv",
      image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
      description: "The final season"
    },
    {
      id: 3,
      title: "Avatar: The Last Airbender",
      year: 2025,
      type: "movie",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
      description: "Live action adaptation"
    },
    {
      id: 4,
      title: "The Crown Season 7",
      year: 2025,
      type: "tv",
      image: "https://images.unsplash.com/photo-1594736797933-d0c62664dc02?w=400&h=600&fit=crop",
      description: "Royal drama continues"
    }
  ];

  const editorPicks = [
    {
      id: 5,
      title: "Inception",
      year: 2024,
      type: "movie",
      image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop",
      description: "Mind-bending thriller"
    },
    {
      id: 6,
      title: "Breaking Bad",
      year: 2024,
      type: "tv",
      image: "https://images.unsplash.com/photo-1489599117333-089b9c5a56a4?w=400&h=600&fit=crop",
      description: "Crime drama masterpiece"
    },
    {
      id: 7,
      title: "Interstellar",
      year: 2024,
      type: "movie",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
      description: "Space epic adventure"
    },
    {
      id: 8,
      title: "Game of Thrones",
      year: 2024,
      type: "tv",
      image: "https://images.unsplash.com/photo-1594736797933-d0c62664dc02?w=400&h=600&fit=crop",
      description: "Fantasy epic series"
    }
  ];

  const movies = [
    {
      id: 9,
      title: "The Matrix",
      year: 2024,
      type: "movie",
      image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop",
      description: "Sci-fi action classic"
    },
    {
      id: 10,
      title: "Pulp Fiction",
      year: 2024,
      type: "movie",
      image: "https://images.unsplash.com/photo-1489599117333-089b9c5a56a4?w=400&h=600&fit=crop",
      description: "Crime noir masterpiece"
    },
    {
      id: 11,
      title: "The Godfather",
      year: 2024,
      type: "movie",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
      description: "Crime family saga"
    },
    {
      id: 12,
      title: "Forrest Gump",
      year: 2024,
      type: "movie",
      image: "https://images.unsplash.com/photo-1594736797933-d0c62664dc02?w=400&h=600&fit=crop",
      description: "Heartwarming drama"
    }
  ];

  const tvShows = [
    {
      id: 13,
      title: "The Office",
      year: 2024,
      type: "tv",
      image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop",
      description: "Comedy workplace series"
    },
    {
      id: 14,
      title: "Friends",
      year: 2024,
      type: "tv",
      image: "https://images.unsplash.com/photo-1489599117333-089b9c5a56a4?w=400&h=600&fit=crop",
      description: "Classic sitcom"
    },
    {
      id: 15,
      title: "The Walking Dead",
      year: 2024,
      type: "tv",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
      description: "Zombie apocalypse series"
    },
    {
      id: 16,
      title: "House of Cards",
      year: 2024,
      type: "tv",
      image: "https://images.unsplash.com/photo-1594736797933-d0c62664dc02?w=400&h=600&fit=crop",
      description: "Political thriller"
    }
  ];

  const handleDownload = (title: string, type: string) => {
    toast({
      title: "Download Started",
      description: `${title} is now downloading in HD quality`,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <HeroSection />
      
      <main className="pb-16">
        <ContentSection
          title="Latest Releases"
          content={latestReleases}
          onDownload={handleDownload}
        />
        
        <ContentSection
          title="Editor Picks"
          content={editorPicks}
          onDownload={handleDownload}
        />
        
        <ContentSection
          title="Movies"
          content={movies}
          onDownload={handleDownload}
          showViewAll
        />
        
        <ContentSection
          title="TV Shows"
          content={tvShows}
          onDownload={handleDownload}
          showViewAll
        />
      </main>
    </div>
  );
};

export default Index;
