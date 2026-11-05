/**
 * College DB Service
 * Integration with CollegeDB API (https://collegedb.in)
 * Provides alias-aware normalized search and retrieval for 50,000+ Indian colleges,
 * universities, and standalone institutions.
 */

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache to preserve rate limits
const cache = new Map();

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data, ttl = CACHE_TTL_MS) {
  // Simple eviction if cache exceeds 500 entries
  if (cache.size > 500) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

class CollegeDbService {
  constructor() {
    this.defaultBaseUrl = 'https://api.collegedb.in';
  }

  getApiKey() {
    return (process.env.COLLEGEDB_API_KEY || '').trim();
  }

  getBaseUrl() {
    return (process.env.COLLEGEDB_BASE_URL || this.defaultBaseUrl).replace(/\/+$/, '');
  }

  getHeaders() {
    const apiKey = this.getApiKey();
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'SmartFace-Attendance-System/2.0'
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    return headers;
  }

  /**
   * Search colleges by keyword with in-memory caching
   * @param {string} query - Search term (min 2 characters)
   * @param {number} [limit=20] - Max results
   * @returns {Promise<{ results: Array, query: string, cached?: boolean }>}
   */
  async searchColleges(query, limit = 20) {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery || cleanQuery.length < 2) {
      return { results: [], query: cleanQuery };
    }

    const cacheKey = `search:${cleanQuery.toLowerCase()}:${limit}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('[CollegeDbService] No COLLEGEDB_API_KEY configured in environment');
      return { results: [], query: cleanQuery, warning: 'COLLEGEDB_API_KEY not configured' };
    }

    try {
      const url = `${this.getBaseUrl()}/v1/colleges/search?q=${encodeURIComponent(cleanQuery)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`[CollegeDbService] API responded with HTTP ${response.status}: ${errorText}`);
        if (response.status === 429) {
          return { results: [], query: cleanQuery, warning: 'CollegeDB daily rate limit reached' };
        }
        return { results: [], query: cleanQuery, error: `CollegeDB Error (${response.status})` };
      }

      const json = await response.json();
      const rawResults = json.results || json.data || [];
      const results = rawResults.slice(0, limit).map(item => ({
        id: item.id || '',
        name: (item.name || '').replace(/^["'\s]+|["'\s]+$/g, '').trim(),
        city: item.city || '',
        state: item.state || '',
        type: item.type || item.institutionCategory || 'College',
        institutionCategory: item.institutionCategory || '',
        aisheCode: item.aisheCode || null,
        website: item.website || null
      }));

      const out = { results, query: cleanQuery };
      setCached(cacheKey, out);
      return out;
    } catch (err) {
      console.error('[CollegeDbService] Search error:', err.message);
      return { results: [], query: cleanQuery, error: err.message };
    }
  }

  /**
   * Get college detailed profile by ID
   * @param {string} id
   */
  async getCollegeById(id) {
    const cleanId = (id || '').trim();
    if (!cleanId) return null;

    const cacheKey = `college:${cleanId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    try {
      const url = `${this.getBaseUrl()}/v1/colleges/${encodeURIComponent(cleanId)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        return null;
      }

      const college = await response.json();
      if (college && college.name) {
        college.name = college.name.replace(/^["'\s]+|["'\s]+$/g, '').trim();
      }
      setCached(cacheKey, college, 60 * 60 * 1000); // 1 hour for specific id
      return college;
    } catch (err) {
      console.error('[CollegeDbService] Get college error:', err.message);
      return null;
    }
  }

  /**
   * List colleges with pagination
   * @param {number} [page=1]
   * @param {number} [pageSize=20]
   */
  async listColleges(page = 1, pageSize = 20) {
    const cacheKey = `list:${page}:${pageSize}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const apiKey = this.getApiKey();
    if (!apiKey) return { data: [], page, pageSize, total: 0 };

    try {
      const url = `${this.getBaseUrl()}/v1/colleges?page=${page}&pageSize=${pageSize}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        return { data: [], page, pageSize, total: 0 };
      }

      const json = await response.json();
      if (Array.isArray(json.data)) {
        json.data = json.data.map(item => ({
          ...item,
          name: (item.name || '').replace(/^["'\s]+|["'\s]+$/g, '').trim()
        }));
      }
      setCached(cacheKey, json);
      return json;
    } catch (err) {
      console.error('[CollegeDbService] List error:', err.message);
      return { data: [], page, pageSize, total: 0, error: err.message };
    }
  }

  /**
   * Clear cache for testing or manual refresh
   */
  clearCache() {
    cache.clear();
  }
}

module.exports = new CollegeDbService();
