
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-[#E50914]">Stream Haven</h1>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-white hover:text-[#E50914] transition-colors">Home</a>
              <a href="#" className="text-white hover:text-[#E50914] transition-colors">Movies</a>
              <a href="#" className="text-white hover:text-[#E50914] transition-colors">TV Shows</a>
              <a href="#" className="text-white hover:text-[#E50914] transition-colors">Editor Picks</a>
            </nav>
          </div>

          {/* Search and Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="hidden sm:flex items-center bg-gray-900 rounded-md px-3 py-2">
              <Search className="h-4 w-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search movies, TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-white placeholder-gray-400 outline-none w-64"
              />
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black border-t border-gray-800">
            <nav className="flex flex-col space-y-4 p-4">
              <a href="#" className="text-white hover:text-[#E50914] transition-colors">Home</a>
              <a href="#" className="text-white hover:text-[#E50914] transition-colors">Movies</a>
              <a href="#" className="text-white hover:text-[#E50914] transition-colors">TV Shows</a>
              <a href="#" className="text-white hover:text-[#E50914] transition-colors">Editor Picks</a>
              
              {/* Mobile Search */}
              <div className="flex items-center bg-gray-900 rounded-md px-3 py-2 mt-4">
                <Search className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent text-white placeholder-gray-400 outline-none flex-1"
                />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
