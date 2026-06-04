import { createApiClient } from './apiClient';

export function createNotificationService(getAccessTokenSilently) {
    const api = createApiClient(getAccessTokenSilently);
    return {
        getAll: (limit = 30, offset = 0) => api.get(`/notifications?limit=${limit}&offset=${offset}`),
        getUnreadCount: () => api.get('/notifications/unread-count'),
        markAsRead: (id) => api.put(`/notifications/${id}/read`),
        markAllAsRead: () => api.put('/notifications/read-all'),
    };
}