const fetch = require('node-fetch');
const { OPENAI_API_URL, OPENAI_API_KEY } = require('../config');

async function generateLLMSummary(promptStatsSnippet, promptNewsSnippet) {
  const requestBody = {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
            `You are a crypto analyst and commentator creating market summaries. Your style is catchy but not hyping.
           You are not a cheerleader, but a thoughtful analyst.`
      },
      {
        role: 'user',
        content: `
We have data on the top coins (by rank and by 4h change) and filtered news.

Coin stats, change24h change7d and other changes are in percent, volumes are in the crypto itself.
${promptStatsSnippet}

Relevant news:
${promptNewsSnippet}

Please generate a detailed market analys. When you speak about a token, add change 24h info in the format "Bitcoin (BTC, +2.3%)"
Include some info from the most interesting news.
Make it very detailed but concise, order your topics by importancy of events and price dynamics.
If you find really interesting technical analysis, include it too.
`
      }
    ],
    max_tokens: 200,
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
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || 'No summary generated.';
}

module.exports = { generateLLMSummary };
