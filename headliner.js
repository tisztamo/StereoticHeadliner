require('dotenv').config();
const { fetchStats, fetchNews } = require('./lib/fetchData');
const { generateLLMSummary } = require('./lib/openai');
const { generateHTMLReport } = require('./lib/generateReport');
const { stripUnwantedFields } = require('./lib/utils');

async function main() {
  let debugLogs = '';
  try {
    debugLogs += '[DEBUG] Starting script...\n';

    let statsData = await fetchStats();
    debugLogs += '[DEBUG] Fetched stats data, length: ' + statsData.length + '\n';
    statsData = statsData.map(stripUnwantedFields);

    // Top by Rank and 4h Change
    const top7ByRank = [...statsData].sort((a, b) => a.rank - b.rank).slice(0, 7);
    const top7ByChange4h = [...statsData].sort((a, b) => b.change4h - a.change4h).slice(0, 7);

    const top7ByRankSymbols = top7ByRank.map(item => item.symbolname.toUpperCase());
    const top7ByChange4hSymbols = top7ByChange4h.map(item => item.symbolname.toUpperCase());
    const relevantSymbols = new Set([...topByRankSymbols, ...topByChange4hSymbols]);
    debugLogs += '[DEBUG] Top Rank: ' + topByRankSymbols.join(', ') + '\n';
    debugLogs += '[DEBUG] Top Change: ' + top7ByChange4hSymbols.join(', ') + '\n';

    const promptStatsSnippet = "Top  by Rank:\n" +
      JSON.stringify(top7ByRank, null, 2) +
      "\n\nTop 7 by 4h Change:\n" +
      JSON.stringify(top7ByChange4h, null, 2);

    let newsData = await fetchNews();
    debugLogs += '[DEBUG] Fetched news data, length: ' + newsData.length + '\n';
    const filteredNews = newsData.filter(article => {
      if (!article.tickers || !Array.isArray(article.tickers)) return false;
      return article.tickers.some(ticker => relevantSymbols.has(ticker.toUpperCase()));
    });
    debugLogs += '[DEBUG] Filtered news count: ' + filteredNews.length + '\n';

    const promptNewsSnippet = filteredNews
      .map((item, idx) => (idx + 1) + '. Title: "' + item.title + '"\n   Headline: "' + item.headline + '"')
      .join('\n');

    debugLogs += '[DEBUG] Requesting summary from LLM...\n';
    const llmOutput = await generateLLMSummary(promptStatsSnippet, promptNewsSnippet);

    // Assume LLM output structure: hook on first line, analysis in between, summary on last line
    const lines = llmOutput.split('\n').filter(line => line.trim() !== '');
    const hook = lines[0] || 'Crypto Market Update';
    const analysis = lines.slice(1, -1).join(' ') || 'Detailed analysis not provided.';
    const summary = lines[lines.length - 1] || 'Summary not provided.';
    debugLogs += '[DEBUG] LLM output received.\n';

    const fileName = generateHTMLReport({ hook, analysis, summary, debugLogs });
    console.log('Report generated: ' + fileName);
  } catch (err) {
    console.error('[ERROR]', err);
  }
}

main();
