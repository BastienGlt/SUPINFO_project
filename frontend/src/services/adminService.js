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
    };
}