// Please rename this file to crawler_backend.cjs and run with 'node crawler_backend.cjs'.
// No code changes needed, just a filename change for CommonJS compatibility.

const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

const VALID_URL_REGEX = /^https?:\/\/[\w.-]+(\:[0-9]+)?(\/.*)?$/i;

// Helper: Wait for and scroll to load more content
async function waitAndScroll(page, selector, maxScrolls = 15) {
  for (let i = 0; i < maxScrolls; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);
    if (await page.$(selector)) break;
  }
}

// Helper: Extract all links from homepage using robust selectors
async function extractLinks(page, homepage) {
  // Wait for at least one movie/episode link or card to appear
  await waitAndScroll(page, 'a[href*="/watch/"],a[href*="/movie/"],a[href*="/episode/"],.card,.movie-card,.film-poster');
  // Try to get all possible links
  const links = await page.$$eval('a', (as) =>
    as.map(a => a.href).filter(href =>
      /\/watch\//.test(href) || /\/movie\//.test(href) || /\/episode\//.test(href)
    )
  );
  // Also try to get links from cards or poster elements
  const cardLinks = await page.$$eval('.card,.movie-card,.film-poster', els =>
    els.map(el => el.querySelector('a')?.href).filter(Boolean)
  );
  const url = new URL(homepage);
  const allLinks = Array.from(new Set([...links, ...cardLinks])).filter(l => l && l.startsWith(url.origin));
  console.log(`Found ${allLinks.length} candidate links on homepage:`);
  allLinks.forEach(l => console.log('  ', l));
  return allLinks;
}

// Helper: Extract info from a movie/episode page
async function extractInfo(page, link) {
  const title = await page.title();
  const image = await page.$eval('img', img => img.src).catch(() => null);
  const description = await page.$eval('meta[name="description"]', m => m.content).catch(() => '');
  let videoUrl = null;
  let found = false;

  // Intercept network requests to catch video URLs loaded dynamically
  const interceptedUrls = [];
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (/\.(m3u8|mp4|webm|mov|avi)(\?|$)/i.test(url)) {
      interceptedUrls.push(url);
      console.log(`[${link}] Intercepted media request:`, url);
    }
    req.continue();
  });

  // Simulate clicking play buttons or overlays
  const playSelectors = ['.vjs-big-play-button', '.jw-icon-play', '.plyr__control--overlaid', '.play-button', '.btn-play', '.big-play', '.start-button', '.video-play-button'];
  for (const sel of playSelectors) {
    if (await page.$(sel)) {
      try {
        await page.click(sel);
        console.log(`[${link}] Clicked play button:`, sel);
        await page.waitForTimeout(1500);
      } catch (e) { /* ignore */ }
    }
  }

  // Try to find a video or embed (as before)
  videoUrl = await page.$eval('video source', s => s.src).catch(() => null);
  if (videoUrl) { console.log(`[${link}] Found <video><source>:`, videoUrl); found = true; }
  if (!videoUrl) {
    videoUrl = await page.$eval('video', v => v.src).catch(() => null);
    if (videoUrl) { console.log(`[${link}] Found <video src>:`, videoUrl); found = true; }
  }
  if (!videoUrl) {
    videoUrl = await page.$eval('iframe', i => i.src).catch(() => null);
    if (videoUrl) { console.log(`[${link}] Found <iframe src>:`, videoUrl); found = true; }
  }
  // Try more selectors and attributes
  if (!videoUrl) {
    videoUrl = await page.$eval('[data-hls]', el => el.getAttribute('data-hls')).catch(() => null);
    if (videoUrl) { console.log(`[${link}] Found [data-hls]:`, videoUrl); found = true; }
  }
  if (!videoUrl) {
    videoUrl = await page.$eval('[data-file]', el => el.getAttribute('data-file')).catch(() => null);
    if (videoUrl) { console.log(`[${link}] Found [data-file]:`, videoUrl); found = true; }
  }
  if (!videoUrl) {
    videoUrl = await page.$eval('source[src]', el => el.getAttribute('src')).catch(() => null);
    if (videoUrl) { console.log(`[${link}] Found <source src>:`, videoUrl); found = true; }
  }
  // Try to find video URLs in data attributes or scripts
  if (!videoUrl) {
    const html = await page.content();
    // Look for .m3u8 or .mp4 in the HTML
    const m3u8Matches = html.match(/https?:\/\/[\w\-./?%&=:#+]+\.m3u8(\?[^"'\s>]*)?/gi) || [];
    const mp4Matches = html.match(/https?:\/\/[\w\-./?%&=:#+]+\.mp4(\?[^"'\s>]*)?/gi) || [];
    if (m3u8Matches.length > 0) {
      videoUrl = m3u8Matches[0];
      console.log(`[${link}] Found m3u8 video URLs:`, m3u8Matches);
      found = true;
    }
    if (!videoUrl && mp4Matches.length > 0) {
      videoUrl = mp4Matches[0];
      console.log(`[${link}] Found mp4 video URLs:`, mp4Matches);
      found = true;
    }
    // Look for data-video or data-src attributes
    if (!videoUrl) {
      const dataAttrMatches = [...html.matchAll(/data-(video|src|hls|file)=["']([^"'>]+)["']/gi)];
      if (dataAttrMatches.length > 0) {
        videoUrl = dataAttrMatches[0][2];
        console.log(`[${link}] Found data-* URLs:`, dataAttrMatches.map(m => m[2]));
        found = true;
      }
    }
    // Try to extract from scripts (common in streaming sites)
    if (!videoUrl) {
      const scriptMatches = [...html.matchAll(/(https?:\/\/[\w\-./?%&=:#+]+\.(mp4|m3u8)(\?[^"'\s>]*)?)/gi)];
      if (scriptMatches.length > 0) {
        videoUrl = scriptMatches[0][1];
        console.log(`[${link}] Found video URL in script:`, videoUrl);
        found = true;
      }
    }
    // Try to extract from common JS variables (e.g., window.playerConfig, sources, etc.)
    if (!videoUrl) {
      const playerConfigMatch = html.match(/playerConfig\s*=\s*({.*?})/s);
      if (playerConfigMatch) {
        try {
          const config = JSON.parse(playerConfigMatch[1]);
          if (config.sources && config.sources.length > 0) {
            videoUrl = config.sources[0].file;
            console.log(`[${link}] Found video URL in playerConfig:`, videoUrl);
            found = true;
          }
        } catch (e) { /* ignore */ }
      }
    }
    // Try to extract from inline scripts (look for URLs in <script> tags)
    if (!videoUrl) {
      const scriptTags = await page.$$eval('script', scripts => scripts.map(s => s.innerText));
      for (const script of scriptTags) {
        const urlMatch = script.match(/https?:\/\/[\w\-./?%&=:#+]+\.(mp4|m3u8)(\?[^"'\s>]*)?/i);
        if (urlMatch) {
          videoUrl = urlMatch[0];
          console.log(`[${link}] Found video URL in inline <script>:`, videoUrl);
          found = true;
          break;
        }
      }
    }
    // If still not found, use intercepted URLs
    if (!videoUrl && interceptedUrls.length > 0) {
      videoUrl = interceptedUrls[0];
      console.log(`[${link}] Using intercepted media URL:`, videoUrl);
      found = true;
    }
    // Log the HTML if nothing is found (for debugging)
    if (!videoUrl) {
      console.log(`[${link}] No video URL found. HTML length:`, html.length);
    }
  }
  // Remove request interception to avoid side effects
  await page.setRequestInterception(false);
  page.removeAllListeners('request');

  console.log(`Extracted from ${link}: title='${title}', videoUrl='${videoUrl}'`);
  return { title, image, description, videoUrl };
}

app.post('/crawl', async (req, res) => {
  const { url } = req.body;
  console.log('Received crawl request for:', url);
  // Input validation: prevent SSRF and invalid URLs
  if (!url || typeof url !== 'string' || !VALID_URL_REGEX.test(url)) {
    console.log('Invalid or missing URL');
    return res.status(400).json({ error: 'Invalid or missing URL' });
  }
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    const results = [];
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    const links = await extractLinks(page, url);
    for (const link of links.slice(0, 30)) { // Limit to 30 for speed
      try {
        await page.goto(link, { waitUntil: 'networkidle2', timeout: 60000 });
        const info = await extractInfo(page, link);
        results.push({ ...info, pageUrl: link });
      } catch (e) {
        console.log(`Failed to extract from ${link}:`, e.toString());
      }
    }
    res.json(results.length > 0 ? results : { error: 'No video links found on any pages.' });
  } catch (e) {
    console.log('Error during crawl:', e.toString());
    res.status(500).json({ error: e.toString() });
  } finally {
    // Cleanup Puppeteer resources
    if (page) {
      try { await page.close(); } catch (e) { /* ignore */ }
    }
    if (browser) {
      try { await browser.close(); } catch (e) { /* ignore */ }
    }
  }
});

app.get('/ping', (req, res) => {
  console.log('Received ping');
  res.send('pong');
});

app.listen(5002, () => {
  console.log('Crawler backend running on http://localhost:5002');
}); 