const RAWG_BASE = 'https://api.rawg.io/api';
const API_KEY = import.meta.env.VITE_RAWG_API_KEY;


const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; 

function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}

export const rawgService = {
    searchGames: async (query, filters = {}) => {
        if (!query || query.length < 2) return [];
        let url = `${RAWG_BASE}/games?key=${API_KEY}&search=${encodeURIComponent(query)}&page_size=12`;
        if (filters.genre) url += `&genres=${filters.genre}`;
        if (filters.year) url += `&dates=${filters.year}-01-01,${filters.year}-12-31`;
        if (filters.page) url += `&page=${filters.page}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.results || [];
    },

    getGenres: async () => {
        const cached = getCached('genres');
        if (cached) return cached;
        const res = await fetch(`${RAWG_BASE}/genres?key=${API_KEY}`);
        const data = await res.json();
        const results = data.results || [];
        setCache('genres', results);
        return results;
    },

    getGameDetails: async (id) => {
        const cacheKey = `game-${id}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;
        const res = await fetch(`${RAWG_BASE}/games/${id}?key=${API_KEY}`);
        if (!res.ok) throw new Error('Jeu introuvable');
        const data = await res.json();
        setCache(cacheKey, data);
        return data;
    },

    getGameScreenshots: async (id) => {
        const cacheKey = `screens-${id}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;
        const res = await fetch(`${RAWG_BASE}/games/${id}/screenshots?key=${API_KEY}`);
        const data = await res.json();
        const results = data.results || [];
        setCache(cacheKey, results);
        return results;
    },
};