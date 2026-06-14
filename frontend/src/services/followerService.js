import { createApiClient } from './apiClient';

export function createFollowerService(getAccessTokenSilently) {
  const api = createApiClient(getAccessTokenSilently);

  return {
    getFollowStats: (userId) => api.get(`/users/${userId}/follow-stats`),
    getFollowers: (userId) => api.get(`/users/${userId}/followers`),
    getFollowing: (userId) => api.get(`/users/${userId}/following`),
    follow: (userId) => api.post(`/users/${userId}/follow`),
    unfollow: (userId) => api.delete(`/users/${userId}/follow`),
    isFollowing: (userId) => api.get(`/users/${userId}/is-following`),
    
    getFollowRequests: () => api.get('/follow-requests'),
    sendFollowRequest: (targetId) => api.post('/follow-requests', { target_id: targetId }),
    handleFollowRequest: (requestId, action) => api.patch(`/follow-requests/${requestId}`, { action }),
  };
}