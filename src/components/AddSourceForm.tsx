
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface AddSourceFormProps {
  onAdd: (sourceData: { name: string; url: string; isActive: boolean }) => void;
  onCancel: () => void;
}

export const AddSourceForm = ({ onAdd, onCancel }: AddSourceFormProps) => {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && url.trim()) {
      try {
        // Validate URL format
        new URL(url.trim());
        onAdd({ name: name.trim(), url: url.trim(), isActive });
        setName("");
        setUrl("");
        setIsActive(true);
      } catch (error) {
        alert('Please enter a valid URL (e.g., https://example.com)');
      }
    }
  };

  const popularSources = [
    { name: "PStream", url: "https://pstream.org" },
    { name: "StreamWish", url: "https://streamwish.to" },
    { name: "FileLions", url: "https://filelions.com" },
    { name: "Custom API", url: "https://your-api.com" },
  ];

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Add New Source</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Source Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., PStream"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
            Source URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://pstream.org/"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-transparent"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 text-[#E50914] focus:ring-[#E50914] border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">
            Enable this source immediately
          </label>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#E50914] hover:bg-[#B20710] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </form>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Popular Sources:</h4>
        <div className="space-y-2">
          {popularSources.map((source) => (
            <button
              key={source.name}
              onClick={() => {
                setName(source.name);
                setUrl(source.url);
              }}
              className="w-full p-2 text-left bg-gray-800 hover:bg-gray-700 rounded-md text-sm text-gray-300 transition-colors"
            >
              <div className="font-medium">{source.name}</div>
              <div className="text-xs text-gray-500">{source.url}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
