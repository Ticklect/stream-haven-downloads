const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testBackend() {
  try {
    console.log('Testing backend health...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 5002,
      path: '/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log('Health check:', healthResponse);

    console.log('\nTesting crawl endpoint...');
    const crawlData = JSON.stringify({ url: 'https://example.com' });
    const crawlResponse = await makeRequest({
      hostname: 'localhost',
      port: 5002,
      path: '/crawl',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(crawlData),
      }
    }, crawlData);
    
    console.log('Crawl response:', crawlResponse);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBackend(); 