/**
 * Example script to:
 * 1. Load and filter top100_stat.json
 *    - first 15 by rank
 *    - first 15 by 4h change
 * 2. Load token-specific news from token-specific.json
 *    - filter news that mentions tokens in either of the two filtered lists
 * 3. Call an OpenAI-compatible API (API key from env var) to generate a short paragraph
 *    describing the overall market mood, referencing coin stats and relevant news
 * 4. Print results and debug logs
 *
 * Run via: node index.js (assuming you have node-fetch installed and environment var OPENAI_API_KEY set)
 */

const fetch = require('node-fetch'); // If Node.js < v18, otherwise you can use built-in fetch
require('dotenv').config();          // For .env file support if needed

// Replace with your actual OpenAI-compatible endpoint
// Typically for official OpenAI usage: https://api.openai.com/v1/chat/completions
const OPENAI_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Pull API key from environment variable
const OPENAI_API_KEY = process.env.OPENROUTER_API_KEY// process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('[ERROR] Missing OPENAI_API_KEY environment variable. Exiting...');
  process.exit(1);
}

// Helper function to remove "image" and "updated" from each stats object
function stripUnwantedFields(stat) {
  // Deconstruct "image" and "updated" to discard them, keep the rest
  const { image, updated, ...rest } = stat;
  return rest;
}

(async function main() {
  try {
    console.log('[DEBUG] Starting script...');

    // 1. Load the stats from top100_stat.json
    console.log('[DEBUG] Fetching top100_stat.json...');
    const statsResponse = await fetch('https://stereotic.com/data/stats/top100_stat.json');
    if (!statsResponse.ok) {
      throw new Error(`Failed to fetch top100_stat.json with status: ${statsResponse.status}`);
    }
    let statsData = await statsResponse.json();
    console.log('[DEBUG] Received stats data. Length:', statsData.length);

    // Remove unwanted fields from all stats before sorting
    statsData = statsData.map(stripUnwantedFields);

    // Filter for first 15 by rank (ascending => rank #1 is top)
    console.log('[DEBUG] Sorting data by rank...');
    const sortedByRank = [...statsData].sort((a, b) => a.rank - b.rank);
    const top15ByRank = sortedByRank.slice(0, 15);

    // Filter for first 15 by 4h change (descending => biggest gainers first)
    console.log('[DEBUG] Sorting data by 4h change...');
    const sortedByChange4h = [...statsData].sort((a, b) => b.change4h - a.change4h);
    const top15ByChange4h = sortedByChange4h.slice(0, 15);

    // Prepare sets of relevant symbols
    const top15ByRankSymbols = top15ByRank.map(item => item.symbolname.toUpperCase());
    const top15ByChange4hSymbols = top15ByChange4h.map(item => item.symbolname.toUpperCase());
    const relevantSymbols = new Set([...top15ByRankSymbols, ...top15ByChange4hSymbols]);

    console.log('[DEBUG] Top 15 by Rank:', top15ByRankSymbols.join(', '));
    console.log('[DEBUG] Top 15 by 4h Change:', top15ByChange4hSymbols.join(', '));

    // 2. Load token-specific news
    console.log('[DEBUG] Fetching token-specific.json...');
    const newsResponse = await fetch('https://stereotic.com/data/news/token-specific.json');
    if (!newsResponse.ok) {
      throw new Error(`Failed to fetch token-specific.json with status: ${newsResponse.status}`);
    }
    const newsData = await newsResponse.json();
    console.log('[DEBUG] Received news data. Length:', newsData.length);

    // Filter news: keep only articles referencing any relevant symbol
    console.log('[DEBUG] Filtering news for relevant symbols...');
    const filteredNews = newsData.filter(article => {
      if (!article.tickers || !Array.isArray(article.tickers)) return false;
      return article.tickers.some(ticker => relevantSymbols.has(ticker.toUpperCase()));
    });

    console.log('[DEBUG] Found', filteredNews.length, 'relevant news items');

    // For the prompt, let's compile some helpful text
    // We'll string-ify the stats and also provide news titles/headlines
    const promptStatsSnippet = `
Top 15 by Rank:
${JSON.stringify(top15ByRank, null, 2)}

Top 15 by 4h Change:
${JSON.stringify(top15ByChange4h, null, 2)}
`;

    console.log("\n\n\nprompt kernel:")
    console.log(promptStatsSnippet)

    const promptNewsSnippet = filteredNews
      .map((item, idx) => {
        return `${idx + 1}. Title: "${item.title}"\n   Headline: "${item.headline}"`;
      })
      .join('\n');

    // 3. Call an OpenAI-compatible API to generate a few-sentence text
    console.log('[DEBUG] Generating text via OpenAI...');

    // We'll ask for a short paragraph or a few sentences
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a crypto analyst and commentator creating short market summaries. Your style is catchy but not hyping. Sometimes you make witty hooks, other times you make more serious statements. You are not a cheerleader, but a thoughtful analyst.'
        },
        {
          role: 'user',
          content: `
We have data on the top coins (by rank and by 4h change), and filtered news.

Coin stats:
${promptStatsSnippet}

Relevant news:
${promptNewsSnippet}

Please, first generate detailed analysis of the current state of the market.
Then, a few-sentence summary describing the overall market mood, referencing these stats and news. Keep it concise, around one or two paragraphs. Inline ticker symbols and relevant stats. , e.g.: "Bitcoin(BTC, +2.3%) will always remain the flagship of the crypto market. Or  can Solana(SOL, -1.2%) be the next Bitcoin?" Use the 24h stats.
Then, a witty hook,
And lastly a single, short paragraph describing the situation
`
        }
      ],
      max_tokens: 200, // Enough room for a short paragraph
      temperature: 1.0
    };

    // Make the request to OpenAI
    let generatedText = '';
    try {
      const openAiResponse = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!openAiResponse.ok) {
        throw new Error(`OpenAI API returned status: ${openAiResponse.status}`);
      }

      const openAiData = await openAiResponse.json();
      generatedText = openAiData?.choices?.[0]?.message?.content?.trim() || 'No text generated.';
    } catch (err) {
      console.warn('[DEBUG] Error while calling OpenAI-compatible API:', err);
      generatedText = 'Could not generate summary at this time.';
    }

    // 4. Print final data
    console.log('====================');
    console.log('Top 15 by Rank:');
    console.log(top15ByRank);
    console.log('====================');
    console.log('Top 15 by 4h Change:');
    console.log(top15ByChange4h);
    console.log('====================');
    console.log('Relevant News:');
    console.log(filteredNews);
    console.log('====================');
    console.log('Generated Summary:');
    console.log(generatedText);
    console.log('====================');

    console.log('[DEBUG] Script complete.');
  } catch (error) {
    console.error('[ERROR]', error);
    process.exit(1);
  }
})();
