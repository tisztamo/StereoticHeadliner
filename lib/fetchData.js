import fetch from 'node-fetch';
import { config } from '../config.js';

export async function fetchStats() {
  const res = await fetch(config.STATS_URL);
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return await res.json();
}

export async function fetchNews() {
  const res = await fetch(config.NEWS_URL);
  if (!res.ok) throw new Error(`Failed to fetch news: ${res.status}`);
  return await res.json();
}