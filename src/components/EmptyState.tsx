
import { Plus, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const EmptyState = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <Globe className="h-24 w-24 text-gray-600 mx-auto mb-8" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            No Content Sources Added
          </h2>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Stream Haven aggregates content from external sources. Add your first streaming source 
            like pstream.org to start browsing movies and TV shows.
          </p>
          
          <Button 
            size="lg" 
            className="bg-[#E50914] hover:bg-[#B20710] text-white px-8 py-3 text-lg font-semibold"
            onClick={() => navigate('/sources')}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Your First Source
          </Button>

          <div className="mt-12 p-6 bg-gray-900 rounded-lg text-left">
            <h3 className="text-white font-semibold mb-3">Popular Sources:</h3>
            <ul className="text-gray-400 space-y-2">
              <li>• pstream.org - Free movies and TV shows</li>
              <li>• Add custom streaming providers</li>
              <li>• Aggregate content from multiple sources</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
