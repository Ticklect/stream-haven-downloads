
import { Trash2, ToggleLeft, ToggleRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Source } from "@/hooks/useSourceContent";

interface SourceListProps {
  sources: Source[];
  onToggle: (sourceId: string) => void;
  onRemove: (sourceId: string) => void;
}

export const SourceList = ({ sources, onToggle, onRemove }: SourceListProps) => {
  if (sources.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-900 rounded-lg">
        <Globe className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No sources added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sources.map((source) => (
        <div
          key={source.id}
          className={`p-4 rounded-lg border transition-colors ${
            source.enabled
              ? 'bg-gray-900 border-[#E50914]'
              : 'bg-gray-800 border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${source.enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                <h3 className="text-white font-semibold">{source.name}</h3>
              </div>
              <p className="text-gray-400 text-sm mt-1 ml-6">{source.url}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle(source.id)}
                className="text-gray-400 hover:text-white"
              >
                {source.enabled ? (
                  <ToggleRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ToggleLeft className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm(`Remove ${source.name}? This will also remove all content from this source.`)) {
                    onRemove(source.id);
                  }
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
