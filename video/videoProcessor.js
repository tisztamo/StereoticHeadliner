import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';
import { generateAvatarVideo } from './heygenVideo.js';
import { generateStereoticVideo } from './stereotic-video.js';

const execAsync = promisify(exec);

/**
 * Generates a video using Stereotic
 * @param {string} text - The headline text to use for the video
 * @returns {Promise<string>} - Path to the generated video file
 */
async function _generateStereoticVideo(text) {
  console.log('Generating Stereotic video...');
  
  // Create output directory if it doesn't exist
  const outputDir = path.join(process.cwd(), 'video', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, `stereotic_${Date.now()}.mp4`);
  
  try {
    await generateStereoticVideo(text, outputPath);
    console.log('Stereotic video generated:', outputPath);
    return outputPath;
  } catch (error) {
    console.error('Error generating Stereotic video:', error);
    throw error;
  }
}

/**
 * Generates a video using HeyGen API
 * @param {string} text - The headline text to use for the video
 * @returns {Promise<string>} - Path to the downloaded HeyGen video
 */
async function generateHeyGenVideo(text) {
  console.log('Generating HeyGen video...');
  
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'video', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `heygen_${Date.now()}.mp4`);
    
    // Call the HeyGen API to generate the video
    const videoUrl = await generateAvatarVideo({
      text: text,
      avatarId: "d361dd5ed751416fa43ec7ba2ec718f6", 
      voiceId: "0011dfc1f6f544f1b8a6988489d6bf47",
      noHeygen: process.argv.includes('--no-heygen')
    });
    
    const response = await fetch(videoUrl);
    const videoBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(videoBuffer));
    
    console.log('HeyGen video downloaded:', outputPath);
    return outputPath;
  } catch (error) {
    console.error('Error generating HeyGen video:', error);
    throw error;
  }
}

/**
 * Combines Stereotic and HeyGen videos
 * @param {string} stereoticVideoPath - Path to the Stereotic video
 * @param {string} heygenVideoPath - Path to the HeyGen video
 * @returns {Promise<string>} - Path to the combined video
 */
async function combineVideos(stereoticVideoPath, heygenVideoPath) {
  console.log('Combining videos...');
  
  const outputDir = path.join(process.cwd(), 'video', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, `combined_${Date.now()}.mp4`);
  
  try {
    // Get the duration of the HeyGen video to set the output duration
    const { stdout: durationStdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${heygenVideoPath}"`
    );
    const duration = parseFloat(durationStdout.trim());
    
    // Use FFmpeg to overlay the HeyGen video (resized to 25%) on top of the Stereotic video
    await execAsync(
      `ffmpeg -i "${stereoticVideoPath}" -i "${heygenVideoPath}" -filter_complex ` +
      `"[1:v]scale=iw*0.25:ih*0.25[overlay];[0:v][overlay]overlay=main_w-overlay_w-10:main_h-overlay_h-10[v]" ` +
      `-map "[v]" -map 1:a -t ${duration} -c:v libx264 -c:a aac "${outputPath}"`
    );
    
    console.log('Combined video created:', outputPath);
    return outputPath;
  } catch (error) {
    console.error('Error combining videos:', error);
    throw error;
  }
}

/**
 * Process video generation when --video flag is provided
 * @param {string} headlineText - The headline text to use for the videos
 * @returns {Promise<string>} - Path to the final video
 */
export async function processVideo(headlineText) {
  try {
    // Generate both videos in parallel
    const [stereoticVideoPath, heygenVideoPath] = await Promise.all([
      _generateStereoticVideo(headlineText),
      generateHeyGenVideo(headlineText)
    ]);
    
    // Combine the videos
    const combinedVideoPath = await combineVideos(stereoticVideoPath, heygenVideoPath);
    
    return combinedVideoPath;
  } catch (error) {
    console.error('Error processing video:', error);
    throw error;
  }
}
