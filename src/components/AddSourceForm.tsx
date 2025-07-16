
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus, AlertTriangle, Loader2 } from "lucide-react";
import { validateUrl, validateSourceName } from "@/utils/security";
import { RECOMMENDED_SOURCES } from '@/hooks/useSourceContent';
import { useDebounce } from "@/hooks/use-debounce";

interface AddSourceFormProps {
  onAdd: (sourceData: { name: string; url: string; isActive: boolean }) => void;
  onCancel: () => void;
}

export const AddSourceForm = ({ onAdd, onCancel }: AddSourceFormProps) => {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce URL validation for better performance
  const debouncedUrl = useDebounce(url, 300);
  const debouncedName = useDebounce(name, 300);

  // Real-time validation with debouncing
  const validateInputs = useCallback(() => {
    const newErrors: { name?: string; url?: string } = {};

    if (debouncedName) {
      const nameValidation = validateSourceName(debouncedName);
      if (!nameValidation.isValid) {
        newErrors.name = nameValidation.error;
      }
    }

    if (debouncedUrl) {
      const urlValidation = validateUrl(debouncedUrl);
      if (!urlValidation.isValid) {
        newErrors.url = urlValidation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [debouncedName, debouncedUrl]);

  // Validate on debounced changes
  useState(() => {
    validateInputs();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsSubmitting(true);
    setErrors({});

    // Final validation
    const nameValidation = validateSourceName(name);
    const urlValidation = validateUrl(url);

    const newErrors: { name?: string; url?: string } = {};

    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error;
    }

    if (!urlValidation.isValid) {
      newErrors.url = urlValidation.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Optimistic UI update - call onAdd immediately
      onAdd({ 
        name: nameValidation.sanitizedName!, 
        url: urlValidation.sanitizedUrl!, 
        isActive 
      });
      
      // Reset form
      setName("");
      setUrl("");
      setIsActive(true);
      setErrors({});
    } catch (error) {
      setErrors({ url: 'Failed to add source. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const popularSources = [
    { name: 'LookMovie', url: 'https://lookmovie2.to/' },
    { name: 'MovieWeb', url: 'https://movieweb.site/' },
    { name: 'Bflix', url: 'https://bflix.gg/' },
    { name: 'Soap2Day', url: 'https://soap2day.rs/' },
  ];

  return (
    <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Add New Source</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors duration-200"
          disabled={isSubmitting}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Source Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., LookMovie"
            maxLength={100}
            className={`w-full px-3 py-2 bg-gray-800 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-transparent transition-all duration-200 ${
              errors.name ? 'border-red-500' : 'border-gray-700'
            }`}
            required
            disabled={isSubmitting}
          />
          {errors.name && (
            <div className="flex items-center mt-1 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {errors.name}
            </div>
          )}
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
            placeholder="https://example.com/"
            maxLength={2048}
            className={`w-full px-3 py-2 bg-gray-800 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-transparent transition-all duration-200 ${
              errors.url ? 'border-red-500' : 'border-gray-700'
            }`}
            required
            disabled={isSubmitting}
          />
          {errors.url && (
            <div className="flex items-center mt-1 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {errors.url}
            </div>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 text-[#E50914] focus:ring-[#E50914] border-gray-300 rounded transition-colors duration-200"
            disabled={isSubmitting}
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">
            Enable this source immediately
          </label>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#E50914] hover:bg-[#B20710] text-white transition-colors duration-200"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </>
          )}
        </Button>

        {/* Recommended sources */}
        <div className="pt-4 border-t border-gray-800">
          <div className="text-gray-300 mb-3 font-semibold">Recommended Sources:</div>
          <div className="flex flex-wrap gap-2">
            {RECOMMENDED_SOURCES.map((src) => (
              <button
                key={src.url}
                type="button"
                className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-[#E50914] hover:text-white transition-all duration-200 text-sm"
                onClick={() => {
                  setName(src.name);
                  setUrl(src.url);
                  setIsActive(true);
                  setErrors({});
                }}
                disabled={isSubmitting}
              >
                {src.name}
              </button>
            ))}
          </div>
        </div>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-800">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Popular Sources:</h4>
        <div className="space-y-2">
          {popularSources.map((source) => (
            <button
              key={source.name}
              onClick={() => {
                setName(source.name);
                setUrl(source.url);
                setErrors({});
              }}
              className="w-full p-3 text-left bg-gray-800 hover:bg-gray-700 rounded-md text-sm text-gray-300 transition-all duration-200 border border-gray-700 hover:border-gray-600"
              disabled={isSubmitting}
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
