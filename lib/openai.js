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
      Authorization: \`Bearer \${OPENAI_API_KEY}\`
    },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) throw new Error(\`OpenAI API error: \${res.status}\`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || 'No summary generated.';
}

module.exports = { generateLLMSummary };
