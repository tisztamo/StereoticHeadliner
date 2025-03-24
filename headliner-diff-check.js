import { config } from 'dotenv';
config(); // Load environment variables
import fs from 'fs';
import path from 'path';
import { fetchStats, fetchNews } from './lib/fetchData.js';
import { generateLLMSummary, generateTitleSummary } from './lib/marketSummary.js';
import { generateHTMLReport } from './lib/generateReport.js';
import { generatePrompts } from './lib/promptGenerator.js';
import { callLLM } from './lib/openrouter.js';
import { config as appConfig } from './config.js';

// Configuration
const DIFF_THRESHOLD = 0.55; // Threshold for considering headlines significantly different (0-1)
const STATS_CHANGE_THRESHOLD = 1.0; // Threshold for considering stats significantly different (percentage)

const LAST_REPORT_PATH = path.join(process.cwd(), 'last_report.json');
const LLM_LOG_PATH = path.join(process.cwd(), 'llm_output_logs.txt');

// Command line arguments
const FORCE_REPORT = process.argv.includes('--force-report');
const ALWAYS_RUN = process.argv.includes('--always-run');

// Cooldown tracking
let lastReportTime = null;
// Track if first run has occurred (for --force-report)
let isFirstRun = true;

// Function to check if two arrays of news items are identical
function areNewsItemsIdentical(previousNews, currentNews) {
  if (!previousNews || !currentNews) return false;
  if (previousNews.length !== currentNews.length) return false;
  
  // Sort news items by title to ensure consistent comparison
  const sortedPrevNews = [...previousNews].sort((a, b) => a.title.localeCompare(b.title));
  const sortedCurrNews = [...currentNews].sort((a, b) => a.title.localeCompare(b.title));
  
  return sortedPrevNews.every((item, index) => {
    const curr = sortedCurrNews[index];
    return item.title === curr.title && item.headline === curr.headline;
  });
}

// Function to check if stats have changed significantly
function haveStatsChangedSignificantly(previousStats, currentStats) {
  if (!previousStats || !currentStats) return true;
  
  // Check changes in top coins by rank
  const prevTop = previousStats.filter(coin => coin.rank <= 7);
  const currTop = currentStats.filter(coin => coin.rank <= 7);
  
  if (prevTop.length !== currTop.length) return true;
  
  // Check if any top coin has changed by more than STATS_CHANGE_THRESHOLD percent
  for (const prevCoin of prevTop) {
    const currCoin = currTop.find(c => c.symbolname === prevCoin.symbolname);
    
    // If a coin in the top N has been replaced, that's a significant change
    if (!currCoin) return true;
    
    // Check for significant changes in key metrics
    if (Math.abs(prevCoin.change1h - currCoin.change1h) > STATS_CHANGE_THRESHOLD ||
        Math.abs(prevCoin.change4h - currCoin.change4h) > STATS_CHANGE_THRESHOLD ||
        Math.abs(prevCoin.change24h - currCoin.change24h) > STATS_CHANGE_THRESHOLD ||
        Math.abs(prevCoin.change7d - currCoin.change7d) > STATS_CHANGE_THRESHOLD) {
      return true;
    }
  }
  
  return false;
}

// Function to append LLM output to log file
function logLLMOutput(output) {
  const timestamp = new Date().toISOString();
  const logEntry = `\n\n[${timestamp}]\n${output}\n${'='.repeat(80)}`;
  
  fs.appendFileSync(LLM_LOG_PATH, logEntry, 'utf8');
}

async function calculateDifference(previousTitleSummary, currentTitleSummary) {
  console.log("\x1b[0mCalculating difference between:\x1b[33m\n", previousTitleSummary, "\x1b[0\nmand\x1b[33m\n", currentTitleSummary, "[0m");
  if (!previousTitleSummary) return 1.0; // If no previous output, consider as completely different
  
  // If titles are identical, consider them the same
  if (previousTitleSummary === currentTitleSummary) return 0.0;
  
  // Use LLM to evaluate title difference
  const messages = [
    {
      role: 'system',
      content: 'You are an AI that evaluates the semantic difference between two cryptocurrency market headlines. Return a number between 0 and 1 representing how different they are in meaning (0 = identical meaning, 1 = completely different meaning). Only return the number, nothing else.'
    },
    {
      role: 'user',
      content: `Evaluate how different these two crypto market headlines are semantically on a scale from 0 to 1:
      
Headline 1:
${previousTitleSummary}

Headline 2:
${currentTitleSummary}

Return only a number between 0 and 1.`
    }
  ];
  
  const response = await callLLM(messages);
  
  // Extract the numeric value from response
  const differenceValue = Number(response.trim());
  console.log("\x1b[33mdifferenceValue:\x1b[0m", differenceValue); 
  return isNaN(differenceValue) ? 0.5 : differenceValue;
}

async function saveData(output, statsData, newsData, titleSummary = null) {
  // Log the LLM output to the log file
  logLLMOutput(output);
  
  // Save data to the last report file
  fs.writeFileSync(LAST_REPORT_PATH, JSON.stringify({
    timestamp: new Date().toISOString(),
    content: output,
    titleSummary: titleSummary || output, // If no separate title summary provided, use the full content
    stats: statsData,
    news: newsData
  }), 'utf8');
}

async function loadPreviousData() {
  const result = { stats: null, news: null, reportContent: null, titleSummary: null };
  
  // Try to load last report data
  if (fs.existsSync(LAST_REPORT_PATH)) {
    try {
      const reportData = JSON.parse(fs.readFileSync(LAST_REPORT_PATH, 'utf8'));
      result.stats = reportData.stats || null;
      result.news = reportData.news || null;
      result.reportContent = reportData.content;
      result.titleSummary = reportData.titleSummary || reportData.content;
    } catch (err) {
      console.error('[ERROR] Failed to read last report data:', err);
    }
  }
  
  return result;
}

async function generateHeadlines() {
  let debugLogs = '';
  try {
    debugLogs += '[DEBUG] Starting headline generation check...\n';

    // Check if we're in cooldown period after a report generation
    if (lastReportTime) {
      const cooldownTimeMs = appConfig.COOLDOWN_MINUTES * 60 * 1000;
      const timeSinceLastReport = Date.now() - lastReportTime;
      
      if (timeSinceLastReport < cooldownTimeMs) {
        const remainingMinutes = Math.ceil((cooldownTimeMs - timeSinceLastReport) / (60 * 1000));
        console.log(`\x1b[33m[${new Date().toISOString()}] In cooldown period after last report. ${remainingMinutes} minutes remaining.\x1b[0m`);
        return;
      }
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
      { useNewFormat: false, precision: 1 },
      addToDebugLogs
    );

    // Load previous data for comparison
    const { stats: previousStats, news: previousNews, titleSummary: lastTitleSummary } = await loadPreviousData();
    
    // Check if data has changed significantly
    const newsIdentical = areNewsItemsIdentical(previousNews, news.filtered);
    const statsChanged = haveStatsChangedSignificantly(previousStats, statsData);
    
    let titleSummaryOutput = null;
    let fullOutput = null;
    let difference = 0;
    
    // Force generation on first run if --force-report is specified
    const shouldForceReport = FORCE_REPORT && isFirstRun;
    
    // Only make an LLM call if there are significant changes in the data or force flags are set
    if (ALWAYS_RUN || shouldForceReport || !newsIdentical || statsChanged) {
      debugLogs += '[INFO] ' + (shouldForceReport ? 'Force report generation requested. ' : '') + 'Generating title and summary...\n';
      
      // First stage: Generate just the title and summary
      titleSummaryOutput = await generateTitleSummary(stats.prompt, news.prompt);
      
      // Calculate difference between outputs if we have previous output
      if (lastTitleSummary) {
        difference = await calculateDifference(lastTitleSummary, titleSummaryOutput);
        debugLogs += `[INFO] Difference score between current and last title summary: ${difference}\n`;
      } else {
        difference = 1.0; // No previous output, consider as completely different
      }
      
      // Only proceed to generate full report if difference is significant or force report is requested
      if (difference >= DIFF_THRESHOLD || shouldForceReport) {
        debugLogs += '[INFO] ' + (shouldForceReport ? 'Forced report generation. ' : 'Significant difference detected. ') + 'Generating full market analysis...\n';
        fullOutput = await generateLLMSummary(stats.prompt, news.prompt, titleSummaryOutput);
        
        // Save current data with full output for future comparisons
        await saveData(fullOutput, statsData, news.filtered, titleSummaryOutput);
      } else {
        debugLogs += '[INFO] No significant difference detected. Skipping full LLM generation.\n';
      }
    } else {
      debugLogs += '[INFO] No significant data changes detected. Skipping LLM call.\n';
    }
    
    // Only generate report if difference is significant and we have full output
    if ((difference >= DIFF_THRESHOLD || shouldForceReport) && fullOutput) {
      debugLogs += '[INFO] Generating new HTML report.\n';
      
      // Parse according to the format scheme
      const paragraphs = fullOutput.split('\n\n').filter(p => p.trim());
      const hook = paragraphs[0]?.trim() || 'Crypto Market Update';
      const summary = paragraphs[1]?.trim() || 'Summary not provided.';
      const analysis = paragraphs.slice(2).join('\n\n') || 'Detailed analysis not provided.';
      
      const fileName = generateHTMLReport({ 
        hook, 
        analysis, 
        summary, 
        debugLogs,
        statsData: stats.prompt
      });
      console.log(`\x1b[33m[${new Date().toISOString()}] Report generated: ${fileName}\x1b[0m`);
      
      // Set cooldown timer after generating a report
      lastReportTime = Date.now();
    } else {
      if (ALWAYS_RUN || !newsIdentical || statsChanged) {
        console.log(`\x1b[33m[${new Date().toISOString()}] Data changed but not enough for a new report (diff score: ${difference}). Skipping report generation.\x1b[0m`);
      } else {
        console.log(`\x1b[33m[${new Date().toISOString()}] No significant data changes. Skipping LLM call and report generation.\x1b[0m`);
      }
    }
    
    // Mark first run as completed
    isFirstRun = false;
  } catch (err) {
    console.error('[ERROR]', err);
  }
}

// Initial run
generateHeadlines();

// Schedule runs at regular intervals
setInterval(generateHeadlines, appConfig.CHECK_INTERVAL_MINUTES * 60 * 1000);
console.log(`\x1b[33mHeadliner started. Running every ${appConfig.CHECK_INTERVAL_MINUTES} minutes. Cooldown after report: ${appConfig.COOLDOWN_MINUTES} minutes.\x1b[0m`); 