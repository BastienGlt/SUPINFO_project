import { createApiClient } from './apiClient';

export function createBibliothequeService(getAccessTokenSilently) {
  const api = createApiClient(getAccessTokenSilently);
  return {
    getItems: (statut) => api.get(`/bibliotheque/items${statut ? `?statut=${statut}` : ''}`),
    addItem: (gameData, statut) => api.post('/bibliotheque/items', {
        api_reference_id: gameData.api_reference_id,
        titre: gameData.titre,
        description: gameData.description,
        statut,
    }),
    updateItem: (id, updates) => api.put(`/bibliotheque/items/${id}`, updates),
    deleteItem: (id) => api.delete(`/bibliotheque/items/${id}`),
    getStats: () => api.get('/bibliotheque/stats'),
  };
}