import { createApiClient } from './apiClient';

const CODE_TO_ID = { 'joue': 1, 'termine': 2, 'envie': 3 };

function resolveStatutId(statut) {
    if (typeof statut === 'number') return statut;
    return CODE_TO_ID[statut] || statut;
}

export function createBibliothequeService(getAccessTokenSilently) {
  const api = createApiClient(getAccessTokenSilently);
  return {
    getItems: (statut) => api.get(`/bibliotheque/items${statut ? `?statut=${statut}` : ''}`),
    addItem: async (gameData, statut) => {
        const statutId = resolveStatutId(statut);

        const result = await api.post('/bibliotheque/items', {
            api_reference_id: gameData.api_reference_id,
            titre: gameData.titre,
            description: gameData.description,
            statut: statutId,
            statut_id: statutId,
        });

        const itemId = result.item_id;
        if (itemId) {
            // Essayer plusieurs formats pour le PUT
            const attempts = [
                { statut_id: statutId },
                { statut: statutId },
                { statut: statut, statut_id: statutId },
            ];
            for (const body of attempts) {
                try {
                    console.log('PUT statut attempt:', body);
                    await api.put(`/bibliotheque/items/${itemId}`, body);
                    break;
                } catch (err) {
                    console.log('PUT failed with:', body, err.message);
                }
            }
        }

        return result;
    },
    updateItem: (id, statut) => {
        const statutId = resolveStatutId(statut);
        return api.put(`/bibliotheque/items/${id}`, {
            statut: statutId,
            statut_id: statutId,
        });
    },
    deleteItem: (id) => api.delete(`/bibliotheque/items/${id}`),
    getStats: () => api.get('/bibliotheque/stats'),
  };
}