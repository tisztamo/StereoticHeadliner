import { processVideo } from './video/videoProcessor.js';

async function testVideo() {
  try {
    console.log('Starting video generation test...');
    const testText = 'Crypto surges as Bitcoin leads the market, reaching new heights amid strong market sentiment';
    
    const videoPath = await processVideo(testText);
    console.log(`Video generated successfully: ${videoPath}`);
  } catch (error) {
    console.error('Error generating video:', error);
  }
}

testVideo(); 