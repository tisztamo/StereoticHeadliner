#!/bin/bash
# This script generates the multi-file Node.js project source files.
# It creates the necessary directories and files:
#   - config.js
#   - lib/fetchData.js
#   - lib/utils.js
#   - lib/openai.js
#   - lib/generateReport.js
#   - index.js
#
# Usage:
#   chmod +x generate_sources.sh
#   ./generate_sources.sh

# Create project directories if they don't exist
mkdir -p lib

# Generate config.js
cat << 'EOF' > config.js
module.exports = {
  OPENAI_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  OPENAI_API_KEY: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  STATS_URL: 'https://stereotic.com/data/stats/top100_stat.json',
  NEWS_URL: 'https://stereotic.com/data/news/token-specific.json'
};
EOF
echo "Generated config.js"

# Generate lib/fetchData.js
cat << 'EOF' > lib/fetchData.js
const fetch = require('node-fetch');
const { STATS_URL, NEWS_URL } = require('../config');

async function fetchStats() {
  const res = await fetch(STATS_URL);
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return await res.json();
}

async function fetchNews() {
  const res = await fetch(NEWS_URL);
  if (!res.ok) throw new Error(`Failed to fetch news: ${res.status}`);
  return await res.json();
}

module.exports = { fetchStats, fetchNews };
EOF
echo "Generated lib/fetchData.js"

# Generate lib/utils.js
cat << 'EOF' > lib/utils.js
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function stripUnwantedFields(stat) {
  const { image, updated, ...rest } = stat;
  return rest;
}

module.exports = { slugify, stripUnwantedFields };
EOF
echo "Generated lib/utils.js"

# Generate lib/openai.js
cat << 'EOF' > lib/openai.js
const fetch = require('node-fetch');
const { OPENAI_API_URL, OPENAI_API_KEY } = require('../config');

async function generateLLMSummary(promptStatsSnippet, promptNewsSnippet) {
  const requestBody = {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'You are a crypto analyst and commentator creating short market summaries. Your style is catchy but not hyping. Sometimes you make witty hooks, other times you make more serious statements. You are not a cheerleader, but a thoughtful analyst.'
      },
      {
        role: 'user',
        content: `
We have data on the top coins (by rank and by 4h change) and filtered news.

Coin stats:
${promptStatsSnippet}

Relevant news:
${promptNewsSnippet}

Please generate a detailed market analysis and a concise summary. Then provide a witty hook.
`
      }
    ],
    max_tokens: 200,
    temperature: 1.0
  };

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || 'No summary generated.';
}

module.exports = { generateLLMSummary };
EOF
echo "Generated lib/openai.js"

# Generate lib/generateReport.js
cat << 'EOF' > lib/generateReport.js
const fs = require('fs');
const path = require('path');
const { slugify } = require('./utils');

function generateHTMLReport({ hook, analysis, summary, debugLogs }) {
  const now = new Date();
  const fileName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${slugify(hook)}.html`;

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${hook}</title>
  <style>
    /* Minimal Tufte-inspired design */
    body {
      font-family: Georgia, serif;
      max-width: 40em;
      margin: 2rem auto;
      padding: 1rem;
      background: #f9f9f9;
      color: #333;
      line-height: 1.6;
    }
    h1, h2, h3 {
      font-family: "Times New Roman", serif;
      margin-bottom: 0.5em;
    }
    #scrollto {
      display: block;
      margin-top: 1em;
    }
    pre.debug {
      font-size: 0.8em;
      background: #eee;
      padding: 1em;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <h1 id="scrollto">${hook}</h1>
  <section>
    <h2>Detailed Analysis</h2>
    <p>${analysis}</p>
  </section>
  <section>
    <h2>Summary</h2>
    <p>${summary}</p>
  </section>
  <section>
    <h2>Debug Logs</h2>
    <pre class="debug">${debugLogs}</pre>
  </section>
</body>
</html>
`;

  fs.writeFileSync(path.join(__dirname, '..', fileName), htmlContent, 'utf8');
  return fileName;
}

module.exports = { generateHTMLReport };
EOF
echo "Generated lib/generateReport.js"

# Generate index.js
cat << 'EOF' > index.js
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

    // Top 15 by Rank and 4h Change
    const top15ByRank = [...statsData].sort((a, b) => a.rank - b.rank).slice(0, 15);
    const top15ByChange4h = [...statsData].sort((a, b) => b.change4h - a.change4h).slice(0, 15);

    const top15ByRankSymbols = top15ByRank.map(item => item.symbolname.toUpperCase());
    const top15ByChange4hSymbols = top15ByChange4h.map(item => item.symbolname.toUpperCase());
    const relevantSymbols = new Set([...top15ByRankSymbols, ...top15ByChange4hSymbols]);
    debugLogs += '[DEBUG] Top15 Rank: ' + top15ByRankSymbols.join(', ') + '\n';
    debugLogs += '[DEBUG] Top15 Change: ' + top15ByChange4hSymbols.join(', ') + '\n';

    const promptStatsSnippet = "Top 15 by Rank:\n" +
      JSON.stringify(top15ByRank, null, 2) +
      "\n\nTop 15 by 4h Change:\n" +
      JSON.stringify(top15ByChange4h, null, 2);

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
EOF
echo "Generated index.js"

echo "All source files have been generated."
