import { stripUnwantedFields } from './utils.js';

/**
 * Generates stats and news prompts from raw data
 * @param {Array} statsData - Raw stats data from API
 * @param {Array} newsData - Raw news data from API
 * @param {Object} options - Configuration options
 * @param {Boolean} options.useNewFormat - Whether to use the newer format (true for headliner.js, false for diff-check)
 * @param {Number} options.precision - Decimal precision for percentage values (default: 1)
 * @param {Function} debugLogger - Function to log debug messages (optional)
 * @returns {Object} Object containing the generated prompts and other data
 */
export function generatePrompts(statsData, newsData, options = {}, debugLogger = null) {
  const { 
    useNewFormat = false, 
    precision = 1
  } = options;
  
  // Helper function for debug logging
  const logDebug = (message) => {
    if (typeof debugLogger === 'function') {
      debugLogger(message);
    }
  };

  // Process stats data
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
  
  if (debugLogger) {
    logDebug('[INFO] Top Rank: ' + top7ByRankSymbols.join(', '));
    logDebug('[INFO] Top Change: ' + top7ByChange4hSymbols.join(', '));
  }

  // Generate stats snippet based on format
  const formatCoin = (coin) => {
    if (useNewFormat) {
      return `Name: ${coin.name ? coin.name : 'N/A'}
TICKER: ${coin.symbolname ? coin.symbolname.toUpperCase() : 'N/A'}
Rank: ${coin.rank || 'N/A'}
Price: $${coin.price || 'N/A'}
Change 1h: ${coin.change1h != null ? coin.change1h.toFixed(precision) : 'N/A'}%
Change 4h: ${coin.change4h != null ? coin.change4h.toFixed(precision) : 'N/A'}%
Change 24h: ${coin.change24h != null ? coin.change24h.toFixed(precision) : 'N/A'}%
Change 7d: ${coin.change7d != null ? coin.change7d.toFixed(precision) : 'N/A'}%`;
    } else {
      return `Name: ${coin.name ? coin.name : 'N/A'} [${coin.symbolname ? coin.symbolname.toUpperCase() : 'N/A'}]
Rank: ${coin.rank || 'N/A'}
Price: $${coin.price || 'N/A'}
Change 1h: ${coin.change1h != null ? coin.change1h.toFixed(precision) : 'N/A'}%
Change 4h: ${coin.change4h != null ? coin.change4h.toFixed(precision) : 'N/A'}%
Change 24h: ${coin.change24h != null ? coin.change24h.toFixed(precision) : 'N/A'}%
Change 7d: ${coin.change7d != null ? coin.change7d.toFixed(precision) : 'N/A'}%`;
    }
  };

  const promptStatsSnippet = "Top by Rank:\n" +
    top7ByRank.map(formatCoin).join('\n') +
    "\n\nTop by 4h Change:\n" +
    top7ByChange4h.map(formatCoin).join('\n');

  // Filter news related to relevant symbols
  const filteredNews = newsData.filter(article => {
    if (!article.tickers || !Array.isArray(article.tickers)) return false;
    return article.tickers.some(ticker => 
      ticker && typeof ticker === 'string' && relevantSymbols.has(ticker.toUpperCase())
    );
  });
  
  if (debugLogger) {
    logDebug('[DEBUG] Filtered news count: ' + filteredNews.length);
  }

  // Generate news snippet
  const promptNewsSnippet = filteredNews
    .map((item, idx) => (idx + 1) + '. Title: "' + item.title + '"\n   Headline: "' + item.headline + '"')
    .join('\n');

  return {
    stats: {
      prompt: promptStatsSnippet,
      top7ByRank,
      top7ByChange4h,
      relevantSymbols
    },
    news: {
      prompt: promptNewsSnippet,
      filtered: filteredNews
    }
  };
} 