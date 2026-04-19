import { createApiClient } from './apiClient';

export function createBibliothequeService(getAccessTokenSilently) {
  const api = createApiClient(getAccessTokenSilently);
  return {
    getItems: (statut) => api.get(`/bibliotheque/items${statut ? `?statut=${statut}` : ''}`),
    addItem: (oeuvre_id, statut) => api.post('/bibliotheque/items', { oeuvre_id, statut }),
    updateItem: (id, updates) => api.put(`/bibliotheque/items/${id}`, updates),
    deleteItem: (id) => api.delete(`/bibliotheque/items/${id}`),
    getStats: () => api.get('/bibliotheque/stats'),
  };
}