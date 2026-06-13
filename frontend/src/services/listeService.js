import { createApiClient } from './apiClient';

export function createListeService(getAccessTokenSilently) {
    const api = createApiClient(getAccessTokenSilently);
    return {
        getMyLists: () => api.get('/listes'),
        getPublicLists: () => api.get('/listes/public'),
        getList: (id) => api.get(`/listes/${id}`),
        getListOeuvres: (id) => api.get(`/listes/${id}/oeuvres`),
        create: (nom, description, visibilite = 'PRIVEE') =>
            api.post('/listes', { nom, description, visibilite }),
        update: (id, data) => api.put(`/listes/${id}`, data),
        delete: (id) => api.delete(`/listes/${id}`),
        addOeuvre: (listeId, gameData) =>
            api.post(`/listes/${listeId}/oeuvres`, {
                api_reference_id: gameData.api_reference_id,
                titre: gameData.titre,
                description: gameData.description,
            }),
        removeOeuvre: (listeId, oeuvreId) =>
            api.delete(`/listes/${listeId}/oeuvres/${oeuvreId}`),
    };
}