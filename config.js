export const config = {
  OPENAI_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  OPENAI_API_KEY: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  DEFAULT_MODEL: process.env.DEFAULT_MODEL || 'anthropic/claude-3.7-sonnet',
  STATS_URL: 'https://stereotic.com/data/stats/top100_stat.json',
  NEWS_URL: 'https://stereotic.com/data/news/token-specific.json'
};
