import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the project root
dotenvConfig({ path: join(__dirname, '.env') });

export const config = {
  OPENAI_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  OPENAI_API_KEY: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  DEFAULT_MODEL: process.env.DEFAULT_MODEL || 'anthropic/claude-3.7-sonnet',
  STATS_URL: 'https://stereotic.com/data/stats/top100_stat.json',
  NEWS_URL: 'https://stereotic.com/data/news/token-specific.json',
  CHECK_INTERVAL_MINUTES: parseInt(process.env.CHECK_INTERVAL_MINUTES || '15', 10),
  COOLDOWN_MINUTES: parseInt(process.env.COOLDOWN_MINUTES || '120', 10),
  MAILERLITE_API_KEY: process.env.MAILERLITE_API_KEY,
  MAILERLITE_GROUP_ID: process.env.MAILERLITE_GROUP_ID || '149782209079805739',
  MAILERLITE_FROM_EMAIL: process.env.MAILERLITE_FROM_EMAIL || 'krisztian@stereotic.com',
  MAILERLITE_FROM_NAME: process.env.MAILERLITE_FROM_NAME || 'Schäffer Krisztián'
};
