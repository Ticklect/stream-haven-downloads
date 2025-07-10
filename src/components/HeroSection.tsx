
import { Play, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const HeroSection = () => {
  const { toast } = useToast();

  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "The featured movie is now downloading in HD quality",
    });
  };

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden mt-16">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1489599117333-089b9c5a56a4?w=1920&h=1080&fit=crop"
          alt="Featured Content"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            The Dark Knight
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
            When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, 
            Batman must accept one of the greatest psychological and physical tests.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-[#E50914] hover:bg-[#B20710] text-white px-8 py-3 text-lg font-semibold"
            >
              <Play className="h-5 w-5 mr-2" />
              Watch Now
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-black px-8 py-3 text-lg font-semibold"
              onClick={handleDownload}
            >
              <Download className="h-5 w-5 mr-2" />
              Download HD
            </Button>
            
            <Button 
              size="lg" 
              variant="ghost" 
              className="text-white hover:bg-white/20 px-8 py-3 text-lg font-semibold"
            >
              <Info className="h-5 w-5 mr-2" />
              More Info
            </Button>
          </div>

          <div className="mt-8 text-gray-300">
            <span className="bg-[#E50914] text-white px-2 py-1 rounded text-sm font-bold mr-4">HD</span>
            <span className="mr-4">2008</span>
            <span className="mr-4">Action, Crime, Drama</span>
            <span>2h 32m</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
};
