require('dotenv').config();
const { fetchStats, fetchNews } = require('./lib/fetchData');
const { generateLLMSummary } = require('./lib/marketSummary');
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
    const top7ByRank = [...statsData]
      .sort((a, b) => (a.rank || Infinity) - (b.rank || Infinity))
      .slice(0, 7);
    const top7ByChange4h = [...statsData]
      .filter(item => item.change4h != null)  // Filter out items with null change4h
      .sort((a, b) => b.change4h - a.change4h)
      .slice(0, 7);

    const top7ByRankSymbols = top7ByRank.map(item => item.symbolname ? item.symbolname.toUpperCase() : 'N/A');
    const top7ByChange4hSymbols = top7ByChange4h.map(item => item.symbolname ? item.symbolname.toUpperCase() : 'N/A');
    const relevantSymbols = new Set([...top7ByRankSymbols, ...top7ByChange4hSymbols]);
    debugLogs += '[INFO] Top Rank: ' + top7ByRankSymbols.join(', ') + '\n';
    debugLogs += '[INFO] Top Change: ' + top7ByChange4hSymbols.join(', ') + '\n';

    const promptStatsSnippet = "Top 7 by Rank:\n" +
      top7ByRank.map(coin => 
        `Name: ${coin.symbolname ? coin.symbolname.toUpperCase() : 'N/A'}
Rank: ${coin.rank || 'N/A'}
Price: $${coin.price || 'N/A'}
Change 1h: ${coin.change1h != null ? coin.change1h.toFixed(3) : 'N/A'}%
Change 4h: ${coin.change4h != null ? coin.change4h.toFixed(3) : 'N/A'}%
Change 24h: ${coin.change24h != null ? coin.change24h.toFixed(3) : 'N/A'}%
Change 7d: ${coin.change7d != null ? coin.change7d.toFixed(3) : 'N/A'}%
`).join('\n') +
      "\n\nTop 7 by 4h Change:\n" +
      top7ByChange4h.map(coin => 
        `Name: ${coin.symbolname ? coin.symbolname.toUpperCase() : 'N/A'}
Rank: ${coin.rank || 'N/A'}
Price: $${coin.price || 'N/A'}
Change 1h: ${coin.change1h != null ? coin.change1h.toFixed(3) : 'N/A'}%
Change 4h: ${coin.change4h != null ? coin.change4h.toFixed(3) : 'N/A'}%
Change 24h: ${coin.change24h != null ? coin.change24h.toFixed(3) : 'N/A'}%
Change 7d: ${coin.change7d != null ? coin.change7d.toFixed(3) : 'N/A'}%
`).join('\n');

    let newsData = await fetchNews();
    debugLogs += '[DEBUG] Fetched news data, length: ' + newsData.length + '\n';
    const filteredNews = newsData.filter(article => {
      if (!article.tickers || !Array.isArray(article.tickers)) return false;
      return article.tickers.some(ticker => 
        ticker && typeof ticker === 'string' && relevantSymbols.has(ticker.toUpperCase())
      );
    });
    debugLogs += '[DEBUG] Filtered news count: ' + filteredNews.length + '\n';

    const promptNewsSnippet = filteredNews
      .map((item, idx) => (idx + 1) + '. Title: "' + item.title + '"\n   Headline: "' + item.headline + '"')
      .join('\n');

    debugLogs += '[DEBUG] Requesting summary from LLM...\n';
    const llmOutput = await generateLLMSummary(promptStatsSnippet, promptNewsSnippet);

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
      statsData: promptStatsSnippet  // Pass the stats data to the report generator
    });
    console.log('Report generated: ' + fileName);
  } catch (err) {
    console.error('[ERROR]', err);
  }
}

main();
