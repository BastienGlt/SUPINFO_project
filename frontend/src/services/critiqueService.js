import { createApiClient } from './apiClient';

export function createCritiqueService(getAccessTokenSilently) {
    const api = createApiClient(getAccessTokenSilently);
    return {
        getRatings: (oeuvreId) => api.get(`/critiques/${oeuvreId}/ratings`),

        getRatingStats: (oeuvreId) => api.get(`/critiques/${oeuvreId}/ratings/stats`),

        createRating: (oeuvreId, note, contenu, gameInfo = {}) =>
            api.post(`/critiques/${oeuvreId}/ratings`, {
                note,
                contenu,
                titre: gameInfo.titre,
                description: gameInfo.description,
                api_reference_id: gameInfo.api_reference_id,
            }),

        updateRating: (oeuvreId, note, contenu, gameInfo = {}) =>
            api.put(`/critiques/${oeuvreId}/ratings`, {
                note,
                contenu,
                titre: gameInfo.titre,
                description: gameInfo.description,
                api_reference_id: gameInfo.api_reference_id,
            }),

        deleteRating: (ratingId) => api.delete(`/critiques/${ratingId}`),

        likeRating: (ratingId) => api.post(`/critiques/${ratingId}/like`),
        unlikeRating: (ratingId) => api.delete(`/critiques/${ratingId}/like`),
    };
}