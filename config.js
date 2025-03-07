module.exports = {
  OPENAI_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  OPENAI_API_KEY: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  STATS_URL: 'https://stereotic.com/data/stats/top100_stat.json',
  NEWS_URL: 'https://stereotic.com/data/news/token-specific.json'
};
