import { fetchStats, fetchNews } from './lib/fetchData.js';
import { generateLLMSummary } from './lib/marketSummary.js';
import { generateHTMLReport } from './lib/generateReport.js';
import { generatePrompts } from './lib/promptGenerator.js';
import { processVideo } from './video/videoProcessor.js';

async function main() {
  let debugLogs = '';
  try {
    debugLogs += '[DEBUG] Starting script...\n';

    // Check if the --video flag is provided
    const generateVideo = process.argv.includes('--video');
    if (generateVideo) {
      debugLogs += '[DEBUG] Video generation is enabled\n';
    }

    // Fetch data
    let statsData = await fetchStats();
    debugLogs += '[DEBUG] Fetched stats data, length: ' + statsData.length + '\n';
    
    let newsData = await fetchNews();
    debugLogs += '[DEBUG] Fetched news data, length: ' + newsData.length + '\n';

    // Generate prompts using the new module
    const addToDebugLogs = (message) => { debugLogs += message + '\n'; };
    const { stats, news } = generatePrompts(
      statsData, 
      newsData, 
      { useNewFormat: true, precision: 3 }, 
      addToDebugLogs
    );

    debugLogs += '[DEBUG] Requesting summary from LLM...\n';
    const llmOutput = await generateLLMSummary(stats.prompt, news.prompt);

    // Parse according to the format scheme:
    // First line: title
    // Second paragraph: summary
    // Remaining paragraphs: detailed analysis
    const paragraphs = llmOutput.split('\n\n').filter(p => p.trim());
    const hook = paragraphs[0]?.trim() || 'Crypto Market Update';
    const summary = paragraphs[1]?.trim() || 'Summary not provided.';
    const analysis = paragraphs.slice(2).join('\n\n') || 'Detailed analysis not provided.';
    debugLogs += '[DEBUG] LLM output received and parsed.\n';

    const fileName = generateHTMLReport({ 
      hook, 
      analysis, 
      summary, 
      debugLogs,
      statsData: stats.prompt  // Pass the stats data to the report generator
    });
    console.log('Report generated: ' + fileName);

    // Generate video if --video flag is provided
    if (generateVideo) {
      debugLogs += '[DEBUG] Starting video generation process...\n';
      try {
        // Use the hook (headline) as the text for the video
        const videoPath = await processVideo(`${hook}.\n\n${summary}\nVisit stereotic.com for more!`);
        console.log(`Video generated successfully: ${videoPath}`);
      } catch (videoError) {
        console.error('[ERROR] Video generation failed:', videoError);
        debugLogs += `[ERROR] Video generation failed: ${videoError.message}\n`;
      }
    }
  } catch (err) {
    console.error('[ERROR]', err);
  }
}

main();
