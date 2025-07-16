const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { JSDOM } = require('jsdom');

const app = express();
const PORT = 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Security: Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Security: Input validation
const validateUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    
    // Block localhost and internal networks
    const blockedHosts = [
      'localhost', '127.0.0.1', '0.0.0.0', '::1',
      '10.0.0.0', '172.16.0.0', '192.168.0.0', '169.254.0.0'
    ];
    
    const hostname = parsed.hostname.toLowerCase();
    for (const blocked of blockedHosts) {
      if (hostname === blocked || hostname.startsWith(blocked)) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
};

// Content extraction strategies
const extractors = {
  // Generic video link extractor
  generic: async (html, url) => {
    const $ = cheerio.load(html);
    const videos = [];
    
    // Look for video elements
    $('video').each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        videos.push({
          title: $(el).attr('title') || `Video ${i + 1}`,
          url: new URL(src, url).href,
          type: 'video'
        });
      }
    });
    
    // Look for video sources
    $('source').each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        videos.push({
          title: $(el).attr('title') || `Source ${i + 1}`,
          url: new URL(src, url).href,
          type: 'video'
        });
      }
    });
    
    // Look for iframe embeds
    $('iframe').each((i, el) => {
      const src = $(el).attr('src');
      if (src && (src.includes('youtube') || src.includes('vimeo') || src.includes('dailymotion'))) {
        videos.push({
          title: $(el).attr('title') || `Embed ${i + 1}`,
          url: new URL(src, url).href,
          type: 'embed'
        });
      }
    });
    
    // Look for common video file extensions
    $('a[href*=".mp4"], a[href*=".webm"], a[href*=".mkv"], a[href*=".mov"], a[href*=".avi"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        videos.push({
          title: $(el).text().trim() || $(el).attr('title') || `Video Link ${i + 1}`,
          url: new URL(href, url).href,
          type: 'direct'
        });
      }
    });
    
    return videos;
  },
  
  // YouTube-like extractor
  youtube: async (html, url) => {
    const $ = cheerio.load(html);
    const videos = [];
    
    // Look for YouTube embed patterns
    $('iframe[src*="youtube"], iframe[src*="youtu.be"]').each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        videos.push({
          title: $(el).attr('title') || `YouTube Video ${i + 1}`,
          url: new URL(src, url).href,
          type: 'youtube'
        });
      }
    });
    
    return videos;
  },
  
  // Streaming site extractor
  streaming: async (html, url) => {
    const $ = cheerio.load(html);
    const videos = [];
    
    // Look for streaming patterns
    $('script').each((i, el) => {
      const content = $(el).html();
      if (content) {
        // Look for video URLs in scripts
        const videoMatches = content.match(/(https?:\/\/[^"'\s]+\.(?:mp4|webm|mkv|mov|avi|m3u8))/gi);
        if (videoMatches) {
          videoMatches.forEach((match, j) => {
            videos.push({
              title: `Stream ${i + 1}-${j + 1}`,
              url: match,
              type: 'stream'
            });
          });
        }
      }
    });
    
    return videos;
  }
};

// Main crawl endpoint
app.post('/crawl', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    if (!validateUrl(url)) {
      return res.status(400).json({ error: 'Invalid or blocked URL' });
    }
    
    console.log(`Crawling: ${url}`);
    
    // Fetch the page
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = response.data;
    const allVideos = [];
    
    // Try all extractors
    for (const [name, extractor] of Object.entries(extractors)) {
      try {
        const videos = await extractor(html, url);
        allVideos.push(...videos);
      } catch (error) {
        console.warn(`Extractor ${name} failed:`, error.message);
      }
    }
    
    // Remove duplicates
    const uniqueVideos = allVideos.filter((video, index, self) => 
      index === self.findIndex(v => v.url === video.url)
    );
    
    // Format response
    const results = uniqueVideos.map((video, index) => ({
      id: Date.now() + index,
      title: video.title,
      description: `Found on ${new URL(url).hostname}`,
      image: '/placeholder.svg',
      videoUrl: video.url,
      type: video.type,
      source: new URL(url).hostname
    }));
    
    console.log(`Found ${results.length} videos from ${url}`);
    
    res.json(results);
    
  } catch (error) {
    console.error('Crawl error:', error.message);
    res.status(500).json({ 
      error: 'Failed to crawl content',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Crawler backend running on http://localhost:${PORT}`);
  console.log('Health check: http://localhost:5002/health');
});

module.exports = app; 