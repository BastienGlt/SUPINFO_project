import { createApiClient } from './apiClient';

export function createBibliothequeService(getAccessTokenSilently) {
  const api = createApiClient(getAccessTokenSilently);
  return {
    getItems: (statutId) => api.get(`/bibliotheque/items${statutId ? `?statut_id=${statutId}` : ''}`),
    addItem: async (gameData, statutId) => {
        const result = await api.post('/bibliotheque/items', {
            api_reference_id: gameData.api_reference_id,
            titre: gameData.titre,
            description: gameData.description,
            statut_id: statutId || 1,
        });
        return result;
    },
    updateItem: (id, statutId) => api.put(`/bibliotheque/items/${id}`, { statut_id: statutId }),
    deleteItem: (id) => api.delete(`/bibliotheque/items/${id}`),
    getStats: () => api.get('/bibliotheque/stats'),
  };
}