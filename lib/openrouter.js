import fetch from 'node-fetch';
import { config } from '../config.js';
import { promptCache } from './promptCache.js';

async function callLLM(messages, model = config.DEFAULT_MODEL || 'anthropic/claude-3.7-sonnet', maxTokens = 2500, temperature = 1.0) {
  console.log("model:", model);
  //model = "openai/gpt-3.5-turbo";

  // Check cache first
  const cachedResponse = promptCache.get(messages, model, maxTokens, temperature);
  if (cachedResponse) {
    console.log("Cache hit! Returning cached response");
    return cachedResponse;
  }

  const requestBody = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature
  };

  console.log("\n\n\nrequest body:", JSON.stringify(requestBody, null, 2))
  const res = await fetch(config.OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.OPENAI_API_KEY}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json()
  console.log("data back:", data);
  const response = data?.choices?.[0]?.message?.content || 'No response generated.';
  
  // Cache the response before returning
  promptCache.set(messages, model, maxTokens, temperature, response);
  
  return response;
}

export { callLLM };