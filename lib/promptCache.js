// Prompt cache with persistence to disk
import fs from 'fs';
import path from 'path';

class PromptCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000; // Maximum number of entries to store
    this.cacheFile = path.join(process.cwd(), 'data', 'promptCache.json');
    this.loadFromDisk();
  }

  // Generate a cache key from messages and model parameters
  generateKey(messages, model, maxTokens, temperature) {
    return JSON.stringify({ messages, model, maxTokens, temperature });
  }

  // Get a cached response
  get(messages, model, maxTokens, temperature) {
    const key = this.generateKey(messages, model, maxTokens, temperature);
    return this.cache.get(key);
  }

  // Store a response in the cache
  set(messages, model, maxTokens, temperature, response) {
    const key = this.generateKey(messages, model, maxTokens, temperature);
    
    // If cache is full, remove the oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, response);
    this.saveToDisk();
  }

  // Clear the cache
  clear() {
    this.cache.clear();
    this.saveToDisk();
  }

  // Load cache from disk
  loadFromDisk() {
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(this.cacheFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Check if cache file exists
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, 'utf8');
        const cacheEntries = JSON.parse(data);
        
        // Restore Map from array of entries
        this.cache = new Map(cacheEntries);
        console.log(`[INFO] Loaded ${this.cache.size} entries from prompt cache`);
      }
    } catch (error) {
      console.error('[ERROR] Failed to load prompt cache from disk:', error);
      // Initialize empty cache if loading fails
      this.cache = new Map();
    }
  }

  // Save cache to disk
  saveToDisk() {
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(this.cacheFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Convert Map to array of entries for JSON serialization
      const cacheEntries = Array.from(this.cache.entries());
      fs.writeFileSync(this.cacheFile, JSON.stringify(cacheEntries), 'utf8');
    } catch (error) {
      console.error('[ERROR] Failed to save prompt cache to disk:', error);
    }
  }
}

// Create and export a singleton instance
const promptCache = new PromptCache();
export { promptCache }; 