
import { useState } from "react";
import { Header } from "@/components/Header";
import { SourceList } from "@/components/SourceList";
import { AddSourceForm } from "@/components/AddSourceForm";
import { useSourceContent } from "@/hooks/useSourceContent";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Sources = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const { sources, addSource, removeSource, toggleSource } = useSourceContent();
  const navigate = useNavigate();

  const handleAddSource = (sourceData: { name: string; url: string; isActive: boolean }) => {
    addSource(sourceData);
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-white hover:text-[#E50914]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Content Sources</h1>
            </div>
            
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-[#E50914] hover:bg-[#B20710] text-white"
              disabled={showAddForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Active Sources ({sources.filter(s => s.isActive).length})
                </h2>
                <SourceList
                  sources={sources}
                  onToggle={toggleSource}
                  onRemove={removeSource}
                />
              </div>
            </div>

            <div className="space-y-6">
              {showAddForm ? (
                <AddSourceForm
                  onAdd={handleAddSource}
                  onCancel={() => setShowAddForm(false)}
                />
              ) : (
                <div className="p-6 bg-gray-900 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">About Sources</h3>
                  <div className="text-gray-400 space-y-3">
                    <p>Stream Haven aggregates content from external streaming providers.</p>
                    <p>Popular sources include:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>pstream.org - Free movies and TV shows</li>
                      <li>Custom streaming APIs</li>
                      <li>Public content aggregators</li>
                    </ul>
                    <p className="text-sm text-gray-500 mt-4">
                      Note: Stream Haven does not host content directly. All content is fetched from the sources you add.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sources;
