import { chromium } from 'playwright';
import { mkdirSync, existsSync, rmSync } from 'fs';
import { spawn } from 'child_process';
import { promisify } from 'util';

const framesDir = 'frames';
// Check if --no-stereotic argument is present
const skipFrameGeneration = process.argv.includes('--no-stereotic');

// Only clear and recreate frames directory if not skipping frame generation
if (!skipFrameGeneration) {
  // Remove the frames directory if it exists, then recreate it
  if (existsSync(framesDir)) {
    rmSync(framesDir, { recursive: true, force: true });
  }
  mkdirSync(framesDir);
}

export async function generateStereoticVideo(text, outputPath = 'output.mp4') {
  // Video parameters
  const durationSeconds = 40;
  const fps = 30;
  const totalFrames = durationSeconds * fps;
  
  // Skip browser automation and frame generation if --no-stereotic is provided
  if (skipFrameGeneration) {
    console.log('Skipping frame generation due to --no-stereotic flag');
  } else {
    // Launch browser (set headless:false to see the browser window)
    const browser = await chromium.launch({ headless: false });
    // Create a browser context with an iPhone-like viewport and user agent
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) ' +
        'AppleWebKit/602.1.50 (KHTML, like Gecko) Mobile/14E5239e'
    });
    const page = await context.newPage();

    // Navigate to the website
    await page.goto('https://stereotic.com');

    // Wait for and click a button containing "Cookie" (if present)
    try {
      const cookieButton = await page.waitForSelector('button:has-text("Cookie")', { timeout: 5000 });
      if (cookieButton) {
        console.log('Cookie button found, clicking it...');
        await cookieButton.click();
      }
    } catch (error) {
      console.log('Cookie button not found or timed out.');
    }

    // Hide sticky navigation elements
    await page.evaluate(() => {
      const stickyElements = document.querySelectorAll('.sticky.top-0');
      stickyElements.forEach(el => {
        el.style.display = 'none';
      });
      console.log(`Hidden ${stickyElements.length} sticky elements`);
    });

    const frameDelay = 50; // additional delay in ms between frames

    console.log(`Starting capture for ${durationSeconds} second (${totalFrames} frames)...`);

    // Capture frames: scroll 1px per frame
    for (let i = 0; i < totalFrames; i++) {
      // Scroll down by i pixels (1px per frame)
      await page.evaluate((y) => window.scrollTo(0, y), i * 2);
      // Wait a bit longer to let the scroll settle
      await new Promise(resolve => setTimeout(resolve, frameDelay));
      const filename = `${framesDir}/frame-${String(i).padStart(4, '0')}.png`;
      await page.screenshot({ path: filename });
    }

    console.log('Capture complete, closing browser...');
    await browser.close();
  }

  // Combine frames into a video using FFmpeg (forcing even dimensions)
  console.log('Combining frames into video using FFmpeg...');
  
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y', // overwrite output if exists
      '-r', String(fps), // input framerate
      '-i', `${framesDir}/frame-%04d.png`, // input files pattern
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // ensure dimensions are even
      '-c:v', 'libx264', // video codec
      '-pix_fmt', 'yuv420p', // pixel format for compatibility
      outputPath // use the provided output path
    ]);

    ffmpeg.stdout.on('data', data => console.log(`FFmpeg stdout: ${data}`));
    ffmpeg.stderr.on('data', data => console.error(`FFmpeg stderr: ${data}`));
    
    ffmpeg.on('close', code => {
      console.log(`FFmpeg process exited with code ${code}`);
      console.log(`Video saved as ${outputPath}`);
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });
    
    ffmpeg.on('error', (err) => {
      reject(err);
    });
  });
}

