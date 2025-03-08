const { callLLM } = require('./openrouter.js');

function createMarketSummaryPrompt(promptStatsSnippet, promptNewsSnippet) {
  return [
    {
      role: 'system',
      content: 
        `You are a crypto analyst and commentator creating market summaries. Your style is catchy but not hyping. You are not a cheerleader, but a thoughtful analyst.`
    },
    {
      role: 'user',
      content: `
We have data on the top coins (by rank and by 4h change) and recent news.
Your task is to generate a detailed market analysis.
Select a catchy title and write it in the first line.
Then write 5-10 paragraphs. separate paragraphs with an empty line.
When you speak about a token, append change 24h info in the format " [TICKER, +0.0%]"
Include some info and thoughts from the most interesting news.
Make it very detailed but concise, order your topics by importancy of events and price dynamics.
If you find really interesting technical analysis, include it too.
Coin stats, change24h change7d and other changes are in percent, volumes are in the crypto itself.

Output format scheme, beware of newlines:

[format scheme start]
A catchy title

Summary, a single paragraph

Detailed analysis, single paragraph 1...

Detailed analysis, single paragraph 2...

...

Detailed analysis, last paragraph...

[format scheme end]

${promptStatsSnippet}


Relevant news:
${promptNewsSnippet}
`
    }
  ];
}

async function generateLLMSummary(promptStatsSnippet, promptNewsSnippet) {
  const messages = createMarketSummaryPrompt(promptStatsSnippet, promptNewsSnippet);
  return await callLLM(messages);
}

module.exports = { generateLLMSummary, createMarketSummaryPrompt }; 