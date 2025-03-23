import { callLLM } from './openrouter.js';

function createMarketSummaryPrompt(promptStatsSnippet, promptNewsSnippet, titleAndSummary) {
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
Use exactly this title and summary paragraph that was already created:
${titleAndSummary}

Then write 5-10 short paragraphs. Separate paragraphs with an empty line.
When you speak about a token, append change 24h info in the format " [TICKER, +0.0%]"
Include some info and thoughts from the most interesting news.
Make it very detailed but concise, order your topics by importancy of events and price dynamics.
If you find really interesting technical analysis, include it too.

Output format scheme, beware of newlines:

[format scheme start]
${titleAndSummary}

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

function createTitleSummaryPrompt(promptStatsSnippet, promptNewsSnippet) {
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
Your task is to generate a catchy title and a market summary.
Select a catchy title and write it in the first line.
Then write a single paragraph summary that captures the key market trends.

Output format scheme, beware of newlines:

[format scheme start]
A catchy title

Summary, a single paragraph
[format scheme end]

${promptStatsSnippet}


Relevant news:
${promptNewsSnippet}
`
    }
  ];
}

export async function generateLLMSummary(promptStatsSnippet, promptNewsSnippet, titleSummary) {
  const messages = createMarketSummaryPrompt(promptStatsSnippet, promptNewsSnippet, titleSummary);
  return await callLLM(messages);
}

export async function generateTitleSummary(promptStatsSnippet, promptNewsSnippet) {
  const messages = createTitleSummaryPrompt(promptStatsSnippet, promptNewsSnippet);
  return await callLLM(messages);
}
