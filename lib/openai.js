const fetch = require('node-fetch');
const { OPENAI_API_URL, OPENAI_API_KEY } = require('../config');

async function generateLLMSummary(promptStatsSnippet, promptNewsSnippet) {
  const requestBody = {
    model: 'anthropic/claude-3.7-sonnet',
    messages: [
      {
        role: 'system',
        content:
            `You are a crypto analyst and commentator creating market summaries. Your style is catchy but not hyping. You are not a cheerleader, but a thoughtful analyst.`
      },
      {
        role: 'user',
        content: `
We have data on the top coins (by rank and by 4h change) and recent news.
Your task is to generate a detailed market analys.
Select a catchy title and write it in the first line.
Then write 15-20 paragraphs. separate paragraphs with an empty line.
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

Detailed analysis, single paragraph 15...

[format scheme end]

${promptStatsSnippet}


Relevant news:
${promptNewsSnippet}

`
      }
    ],
    max_tokens: 2500,
    temperature: 1.0
  };

  console.log("\n\n\nrequest body:", JSON.stringify(requestBody, null, 2))
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json()
	console.log("data back:", data)	;
  return data?.choices?.[0]?.message?.content || 'No summary generated.';
}

module.exports = { generateLLMSummary };
