const RAWG_BASE = 'https://api.rawg.io/api';
const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

export const rawgService = {
    searchGames: async (query, filters = {}) => {
        if (!query || query.length < 2) return [];
        let url = `${RAWG_BASE}/games?key=${API_KEY}&search=${encodeURIComponent(query)}&page_size=12`;
        if (filters.genre) url += `&genres=${filters.genre}`;
        if (filters.year) url += `&dates=${filters.year}-01-01,${filters.year}-12-31`;
        if (filters.developer) url += `&developers=${encodeURIComponent(filters.developer)}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.results || [];
    },

    getGenres: async () => {
        const res = await fetch(`${RAWG_BASE}/genres?key=${API_KEY}`);
        const data = await res.json();
        return data.results || [];
    },

    getGameDetails: async (id) => {
        const res = await fetch(`${RAWG_BASE}/games/${id}?key=${API_KEY}`);
        if (!res.ok) throw new Error('Jeu introuvable');
        return await res.json();
    },

    getGameScreenshots: async (id) => {
        const res = await fetch(`${RAWG_BASE}/games/${id}/screenshots?key=${API_KEY}`);
        const data = await res.json();
        return data.results || [];
    },
};