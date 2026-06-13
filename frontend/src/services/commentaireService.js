import { createApiClient } from './apiClient';

export function createCommentaireService(getAccessTokenSilently) {
    const api = createApiClient(getAccessTokenSilently);
    return {
        getByRating: (critiqueId) => api.get(`/commentaires/critiques/${critiqueId}`),
        create: (critiqueId, contenu) => api.post(`/commentaires/critiques/${critiqueId}`, { contenu }),
        update: (commentaireId, contenu) => api.put(`/commentaires/${commentaireId}`, { contenu }),
        delete: (commentaireId) => api.delete(`/commentaires/${commentaireId}`),
    };
}