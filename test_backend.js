const fetch = require('node-fetch');

async function testBackend() {
  try {
    console.log('Testing backend health...');
    const healthResponse = await fetch('http://localhost:5002/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);

    console.log('\nTesting crawl endpoint...');
    const crawlResponse = await fetch('http://localhost:5002/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    if (!crawlResponse.ok) {
      console.error('Crawl failed:', crawlResponse.status, crawlResponse.statusText);
      const errorText = await crawlResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const crawlData = await crawlResponse.json();
    console.log('Crawl response:', JSON.stringify(crawlData, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBackend(); 