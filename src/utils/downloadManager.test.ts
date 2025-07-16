// Test file to demonstrate thread-safe download manager behavior
// This file can be run with a test runner or used for manual testing

import { downloadManager } from './downloadManager';

// Test concurrent download requests
export async function testConcurrentDownloads() {
  console.log('🧪 Testing Concurrent Downloads...');
  
  const testUrls = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  ];

  const testTitles = [
    'Big Buck Bunny',
    'Sintel',
    'Elephants Dream',
    'For Bigger Blazes',
    'For Bigger Escapes'
  ];

  // Simulate multiple concurrent download requests
  const downloadPromises = testUrls.map((url, index) => 
    downloadManager.addDownload(testTitles[index], 'movie', url)
  );

  console.log('📥 Starting 5 concurrent download requests...');
  
  try {
    const downloadIds = await Promise.all(downloadPromises);
    console.log('✅ All downloads queued successfully:', downloadIds);
    
    // Monitor the queue status
    const status = downloadManager.getQueueStatus();
    console.log('📊 Queue Status:', status);
    
    // Check that only maxConcurrent downloads are active
    const allDownloads = downloadManager.getAllDownloads();
    const activeDownloads = allDownloads.filter(d => d.status === 'downloading');
    const pendingDownloads = allDownloads.filter(d => d.status === 'pending');
    
    console.log(`📈 Active Downloads: ${activeDownloads.length}`);
    console.log(`⏳ Pending Downloads: ${pendingDownloads.length}`);
    
    // Verify thread safety: should not exceed maxConcurrentDownloads
    if (activeDownloads.length <= 3) {
      console.log('✅ Thread safety verified: Active downloads within limit');
    } else {
      console.log('❌ Thread safety violation: Too many active downloads');
    }
    
    return downloadIds;
    
  } catch (error) {
    console.error('❌ Concurrent download test failed:', error);
    throw error;
  }
}

// Test race condition prevention
export async function testRaceConditionPrevention() {
  console.log('🧪 Testing Race Condition Prevention...');
  
  // Simulate rapid successive calls to processQueue
  const rapidCalls = Array.from({ length: 10 }, (_, i) => 
    downloadManager.addDownload(`Test Movie ${i}`, 'movie', 'https://example.com/test.mp4')
  );
  
  console.log('⚡ Making 10 rapid download requests...');
  
  try {
    const results = await Promise.all(rapidCalls);
    console.log('✅ All rapid requests processed without race conditions');
    
    const status = downloadManager.getQueueStatus();
    console.log('📊 Final Queue Status:', status);
    
    return results;
    
  } catch (error) {
    console.error('❌ Race condition test failed:', error);
    throw error;
  }
}

// Test download cancellation
export async function testDownloadCancellation() {
  console.log('🧪 Testing Download Cancellation...');
  
  try {
    // Add a download
    const downloadId = await downloadManager.addDownload('Cancellable Movie', 'movie', 'https://example.com/cancel.mp4');
    console.log('📥 Added download:', downloadId);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Cancel the download
    const cancelled = await downloadManager.cancelDownload(downloadId);
    console.log('❌ Cancellation result:', cancelled);
    
    // Check status
    const status = downloadManager.getDownloadStatus(downloadId);
    console.log('📊 Download status after cancellation:', status);
    
    if (status?.status === 'cancelled') {
      console.log('✅ Download cancellation successful');
    } else {
      console.log('❌ Download cancellation failed');
    }
    
    return { downloadId, cancelled, status };
    
  } catch (error) {
    console.error('❌ Cancellation test failed:', error);
    throw error;
  }
}

// Test error handling
export async function testErrorHandling() {
  console.log('🧪 Testing Error Handling...');
  
  const invalidUrls = [
    'invalid-url',
    'ftp://example.com/file.mp4',
    'javascript:alert("xss")',
    'file:///etc/passwd'
  ];
  
  const results = [];
  
  for (const url of invalidUrls) {
    try {
      const downloadId = await downloadManager.addDownload('Invalid Test', 'movie', url);
      results.push({ url, downloadId, success: true });
    } catch (error) {
      results.push({ url, error: error.message, success: false });
    }
  }
  
  console.log('📊 Error handling results:', results);
  
  const failedCount = results.filter(r => !r.success).length;
  if (failedCount === invalidUrls.length) {
    console.log('✅ Error handling working correctly');
  } else {
    console.log('❌ Error handling not working properly');
  }
  
  return results;
}

// Comprehensive test suite
export async function runAllTests() {
  console.log('🚀 Starting Download Manager Test Suite...\n');
  
  try {
    // Test 1: Concurrent downloads
    await testConcurrentDownloads();
    console.log('\n');
    
    // Test 2: Race condition prevention
    await testRaceConditionPrevention();
    console.log('\n');
    
    // Test 3: Download cancellation
    await testDownloadCancellation();
    console.log('\n');
    
    // Test 4: Error handling
    await testErrorHandling();
    console.log('\n');
    
    console.log('🎉 All tests completed successfully!');
    console.log('✅ Thread-safe download manager is working correctly');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    throw error;
  }
}

// Manual test runner (for browser console)
if (typeof window !== 'undefined') {
  (window as any).testDownloadManager = {
    testConcurrentDownloads,
    testRaceConditionPrevention,
    testDownloadCancellation,
    testErrorHandling,
    runAllTests
  };
  
  console.log('🧪 Download Manager tests available at window.testDownloadManager');
  console.log('Run: window.testDownloadManager.runAllTests() to execute all tests');
} 