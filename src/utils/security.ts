import DOMPurify from 'dompurify';

// Allowed URL protocols for security
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

// Maximum lengths for input validation
const MAX_SOURCE_NAME_LENGTH = 100;
const MAX_URL_LENGTH = 2048;

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

/**
 * Sanitizes plain text input
 */
export const sanitizeText = (text: string): string => {
  return text.replace(/[<>\"'&]/g, (char) => {
    const entities: { [key: string]: string } = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    };
    return entities[char] || char;
  });
};

/**
 * Validates and sanitizes URLs
 */
export const validateUrl = (url: string): { isValid: boolean; sanitizedUrl?: string; error?: string } => {
  try {
    const trimmedUrl = url.trim();
    
    if (trimmedUrl.length > MAX_URL_LENGTH) {
      return { isValid: false, error: 'URL too long' };
    }

    const parsedUrl = new URL(trimmedUrl);
    
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }

    return { isValid: true, sanitizedUrl: parsedUrl.toString() };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

/**
 * Validates source name
 */
export const validateSourceName = (name: string): { isValid: boolean; sanitizedName?: string; error?: string } => {
  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    return { isValid: false, error: 'Source name cannot be empty' };
  }
  
  if (trimmedName.length > MAX_SOURCE_NAME_LENGTH) {
    return { isValid: false, error: 'Source name too long' };
  }

  // Check for potentially dangerous characters
  if (/[<>\"'&]/.test(trimmedName)) {
    return { isValid: false, error: 'Source name contains invalid characters' };
  }

  return { isValid: true, sanitizedName: sanitizeText(trimmedName) };
};

/**
 * Validates download URL before executing
 */
export const validateDownloadUrl = (url: string): { isValid: boolean; error?: string } => {
  const urlValidation = validateUrl(url);
  
  if (!urlValidation.isValid) {
    return urlValidation;
  }

  try {
    const parsedUrl = new URL(url);
    
    // Additional security checks for download URLs
    if (parsedUrl.protocol === 'file:' || parsedUrl.protocol === 'javascript:') {
      return { isValid: false, error: 'Unsafe download protocol' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid download URL' };
  }
};

/**
 * Safely parse JSON with error handling
 */
export const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Basic validation - ensure it's an object if expected
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    
    return fallback;
  } catch (error) {
    console.warn('Failed to parse JSON safely:', error);
    return fallback;
  }
};

/**
 * Creates a secure download filename
 */
export const createSecureFilename = (title: string, type: string): string => {
  // Remove potentially dangerous characters and limit length
  const cleanTitle = title
    .replace(/[^a-zA-Z0-9\s\-_.]/g, '')
    .replace(/\s+/g, '_')
    .trim()
    .substring(0, 50);
  
  const extension = 'mp4'; // Use mp4 for all video content
  return `${cleanTitle}.${extension}`;
};