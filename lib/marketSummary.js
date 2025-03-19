import { callLLM } from './openrouter.js';

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
Then write a single paragraph summary.
Then write 5-10 short paragraphs. Separate paragraphs with an empty line.
When you speak about a token, append change 24h info in the format " [TICKER, +0.0%]"
Include some info and thoughts from the most interesting news.
Make it very detailed but concise, order your topics by importancy of events and price dynamics.
If you find really interesting technical analysis, include it too.

Output format scheme, beware of newlines:

[format scheme start]
A catchy title

Summary, a single paragraph

Detailed analysis, single short paragraph 1...

Detailed analysis, single short paragraph 2...

...

Detailed analysis, last short paragraph...

[format scheme end]

${promptStatsSnippet}


Relevant news:
${promptNewsSnippet}
`
    }
  ];
}

export async function generateLLMSummary(promptStatsSnippet, promptNewsSnippet) {
  const messages = createMarketSummaryPrompt(promptStatsSnippet, promptNewsSnippet);
  return await callLLM(messages);
}
