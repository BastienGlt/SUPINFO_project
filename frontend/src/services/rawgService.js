const RAWG_BASE = 'https://api.rawg.io/api';
const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

export const rawgService = {
    searchGames: async (query) => {
        if (!query || query.length < 2) return [];
        const res = await fetch(
            `${RAWG_BASE}/games?key=${API_KEY}&search=${encodeURIComponent(query)}&page_size=10`
        );
        const data = await res.json();
        return data.results || [];
    },

    getGameDetails: async (id) => {
        const res = await fetch(`${RAWG_BASE}/games/${id}?key=${API_KEY}`);
        return await res.json();
    },
};