import { createApiClient } from './apiClient';

export function createCritiqueService(getAccessTokenSilently) {
    const api = createApiClient(getAccessTokenSilently);
    return {
        
        getRatings: (oeuvreId) => api.get(`/critiques/${oeuvreId}/ratings`),

       
        getRatingStats: (oeuvreId) => api.get(`/critiques/${oeuvreId}/ratings/stats`),

      
        createRating: (oeuvreId, note, contenu) =>
            api.post(`/critiques/${oeuvreId}/ratings`, { note, contenu }),

       
        updateRating: (oeuvreId, note, contenu) =>
            api.put(`/critiques/${oeuvreId}/ratings`, { note, contenu }),

       
        deleteRating: (ratingId) => api.delete(`/critiques/${ratingId}`),

      
        likeRating: (ratingId) => api.post(`/critiques/${ratingId}/like`),
        unlikeRating: (ratingId) => api.delete(`/critiques/${ratingId}/like`),
    };
}