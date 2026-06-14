import { createApiClient } from './apiClient';

export function createAdminService(getAccessTokenSilently) {
    const api = createApiClient(getAccessTokenSilently);
    return {
        // Critiques
        getFeatured: () => api.get('/admin/critiques/featured'),
        feature: (id) => api.post(`/admin/critiques/${id}/feature`),
        unfeature: (id) => api.delete(`/admin/critiques/${id}/feature`),
        getHidden: () => api.get('/admin/critiques/hidden'),
        hide: (id) => api.post(`/admin/critiques/${id}/hide`),
        unhide: (id) => api.delete(`/admin/critiques/${id}/hide`),
        deleteCritique: (id) => api.delete(`/admin/critiques/${id}`),
        deleteComment: (id) => api.delete(`/admin/commentaires/${id}`),
        // Utilisateurs
        getBanned: () => api.get('/admin/users/banned'),
        ban: (id) => api.put(`/admin/users/${id}/ban`),
        unban: (id) => api.put(`/admin/users/${id}/unban`),
        getWarned: () => api.get('/admin/users/warned'),
        warn: (id) => api.put(`/admin/users/${id}/warn`),
        unwarn: (id) => api.put(`/admin/users/${id}/unwarn`),
        // Signalements (via API au lieu de localStorage)
        getSignalements: (statut, type) => {
            let url = '/admin/signalements';
            const params = [];
            if (statut) params.push(`statut=${statut}`);
            if (type) params.push(`type_contenu=${type}`);
            if (params.length) url += '?' + params.join('&');
            return api.get(url);
        },
        getSignalement: (id) => api.get(`/admin/signalements/${id}`),
        updateSignalementStatut: (id, statut) => api.put(`/admin/signalements/${id}/statut`, { statut }),
        deleteSignalement: (id) => api.delete(`/admin/signalements/${id}`),
    };
}