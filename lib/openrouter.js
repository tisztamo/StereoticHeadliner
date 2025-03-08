const fetch = require('node-fetch');
const { OPENAI_API_URL, OPENAI_API_KEY, DEFAULT_MODEL } = require('../config');

async function callLLM(messages, model = DEFAULT_MODEL || 'anthropic/claude-3.7-sonnet', maxTokens = 2500, temperature = 1.0) {
  const requestBody = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature
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
  console.log("data back:", data);
  return data?.choices?.[0]?.message?.content || 'No response generated.';
}

module.exports = { callLLM }; 