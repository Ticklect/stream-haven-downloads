import DOMPurify from 'dompurify';

// Allowed URL protocols for security
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

// Maximum lengths for input validation
const MAX_SOURCE_NAME_LENGTH = 100;
const MAX_URL_LENGTH = 2048;

// Blocked hostnames for security (more permissive for streaming sites)
const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '10.0.0.0',
  '172.16.0.0',
  '192.168.0.0',
  '169.254.0.0'
];

// Video file extensions for proper filename generation
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mkv', '.mov', '.avi', '.m4v', '.3gp', '.flv', '.wmv', '.flv'];

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
  return text.replace(/[<>"'&]/g, (char) => {
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
 * Validates and sanitizes URLs with enhanced security checks
 * More permissive for legitimate streaming sources
 */
export const validateUrl = (url: string): { isValid: boolean; sanitizedUrl?: string; error?: string } => {
  try {
    const trimmedUrl = url.trim();
    
    if (trimmedUrl.length > MAX_URL_LENGTH) {
      return { isValid: false, error: 'URL is too long' };
    }

    const parsedUrl = new URL(trimmedUrl);
    
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }

    // Check for blocked hostnames (localhost, internal networks)
    const hostname = parsedUrl.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.some(blocked => hostname === blocked || hostname.startsWith(blocked))) {
      return { isValid: false, error: 'Blocked or unsafe hostname' };
    }

    // Check for suspicious patterns (more permissive)
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i,
      /mailto:/i,
      /tel:/i,
      /about:/i,
      /chrome:/i,
      /moz-extension:/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(parsedUrl.href))) {
      return { isValid: false, error: 'URL contains suspicious patterns' };
    }

    // Validate URL structure
    if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
      return { isValid: false, error: 'Invalid hostname' };
    }

    // Allow common streaming site patterns
    const streamingPatterns = [
      /\.(com|org|net|tv|io|co|me|cc|ws|to|ru|uk|de|fr|es|it|nl|se|no|dk|fi|pl|cz|hu|ro|bg|hr|si|sk|ee|lv|lt|pt|gr|be|at|ch|ie|lu|mt|cy|mc|ad|li|va|sm|kz|by|md|ge|am|az|kg|tj|tm|uz|mn|mn|la|kh|mm|bd|np|lk|mv|bt|pk|af|ir|iq|sy|lb|jo|ps|kw|bh|qa|ae|om|ye|sa|eg|ly|tn|dz|ma|mr|ml|sn|gn|gw|cv|bf|ci|gh|tg|bj|ng|cm|cf|td|gq|ga|cg|cd|ao|zm|mw|zw|bw|na|sz|ls|za|mg|re|mu|sc|km|yt|dj|so|et|er|sd|ss|ke|ug|rw|bi|tz|mz|zw|bw|na|sz|ls|za|mg|re|mu|sc|km|yt|dj|so|et|er|sd|ss|ke|ug|rw|bi|tz|mz)$/i,
      /stream/i,
      /video/i,
      /movie/i,
      /tv/i,
      /watch/i,
      /play/i,
      /media/i,
      /content/i,
      /entertainment/i
    ];

    // If it's a streaming-related domain, be more permissive
    const isStreamingDomain = streamingPatterns.some(pattern => 
      pattern.test(parsedUrl.hostname) || pattern.test(parsedUrl.pathname)
    );

    if (isStreamingDomain) {
      // More permissive validation for streaming sites
      console.log('Streaming domain detected, using permissive validation:', parsedUrl.hostname);
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

  // Check for potentially dangerous characters (more permissive)
  if (/[<>"'&]/.test(trimmedName)) {
    return { isValid: false, error: 'Source name contains invalid characters' };
  }

  return { isValid: true, sanitizedName: sanitizeText(trimmedName) };
};

/**
 * Validates download URL before executing with enhanced security
 * More permissive for legitimate streaming sources
 */
export const validateDownloadUrl = (url: string): { isValid: boolean; error?: string; sanitizedUrl?: string } => {
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

    // Check for common video file extensions
    const videoExtensions = ['.mp4', '.webm', '.mkv', '.mov', '.avi', '.m4v', '.3gp', '.flv', '.wmv'];
    const hasVideoExtension = videoExtensions.some(ext => 
      parsedUrl.pathname.toLowerCase().includes(ext)
    );

    // Check for streaming URLs (more permissive)
    const streamingPatterns = [
      /\.m3u8$/i, // HLS streams
      /\.mpd$/i,  // DASH streams
      /\/manifest\.m3u8/i,
      /\/playlist\.m3u8/i,
      /\/stream\//i,
      /\/video\//i,
      /\/media\//i,
      /\/watch\//i,
      /\/movie\//i,
      /\/tv\//i,
      /\/episode\//i,
      /\/content\//i
    ];
    
    const isStreamingUrl = streamingPatterns.some(pattern => 
      pattern.test(parsedUrl.pathname) || pattern.test(parsedUrl.href)
    );

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i,
      /mailto:/i,
      /tel:/i
    ];
    
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
      pattern.test(parsedUrl.href)
    );

    if (hasSuspiciousPattern) {
      return { isValid: false, error: 'URL contains suspicious patterns' };
    }

    // Validate hostname (optional - can be customized)
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1'
    ];
    
    if (blockedHosts.includes(parsedUrl.hostname.toLowerCase())) {
      return { isValid: false, error: 'Blocked hostname' };
    }

    // Check URL length for download URLs
    if (parsedUrl.href.length > 2048) {
      return { isValid: false, error: 'Download URL too long' };
    }

    // If it's not a video file or streaming URL, still allow but warn
    if (!hasVideoExtension && !isStreamingUrl) {
      console.warn('Download URL does not appear to be a video file:', url);
      // Don't block it, just warn
    }

    return { 
      isValid: true, 
      sanitizedUrl: parsedUrl.toString()
    };
  } catch (error) {
    return { isValid: false, error: 'Invalid download URL format' };
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
 * Creates a secure download filename with proper extension detection
 */
export const createSecureFilename = (title: string, url?: string, type?: string): string => {
  // Remove potentially dangerous characters and limit length
  const cleanTitle = title
    .replace(/[^a-zA-Z0-9\s\-_.]/g, '')
    .replace(/\s+/g, '_')
    .trim()
    .substring(0, 50);
  
  // Determine proper extension
  let extension = 'mp4'; // Default fallback
  
  if (url) {
    // Try to extract extension from URL
    const urlExtension = VIDEO_EXTENSIONS.find(ext => 
      url.toLowerCase().includes(ext)
    );
    if (urlExtension) {
      extension = urlExtension.substring(1); // Remove the dot
    }
  }
  
  // Override with explicit type if provided
  if (type && type !== 'video') {
    extension = type.toLowerCase();
  }
  
  return `${cleanTitle}.${extension}`;
};

// Custom SecurityError
export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

// Security middleware for content validation
export const validateContent = {
  url: (url: string) => {
    const urlPattern = /^https:\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlPattern.test(url)) throw new SecurityError('Invalid URL format');
    // Additional security checks can be added here
  },
  fileType: (filename: string) => {
    const allowedTypes = ['.mp4', '.mp3', '.m3u8'];
    if (!allowedTypes.some(ext => filename.endsWith(ext))) {
      throw new SecurityError('Unsupported file type');
    }
  }
};