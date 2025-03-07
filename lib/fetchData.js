const fetch = require('node-fetch');
const { STATS_URL, NEWS_URL } = require('../config');

async function fetchStats() {
  const res = await fetch(STATS_URL);
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return await res.json();
}

async function fetchNews() {
  const res = await fetch(NEWS_URL);
  if (!res.ok) throw new Error(`Failed to fetch news: ${res.status}`);
  return await res.json();
}

module.exports = { fetchStats, fetchNews };
