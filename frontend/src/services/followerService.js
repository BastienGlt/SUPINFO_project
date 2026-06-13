import { createApiClient } from './apiClient';

export function createFollowerService(getAccessTokenSilently) {
  const api = createApiClient(getAccessTokenSilently);

  return {
    getFollowStats: (userId) => api.get(`/users/${userId}/follow-stats`),
    getFollowers: (userId) => api.get(`/users/${userId}/followers`),
    getFollowing: (userId) => api.get(`/users/${userId}/following`),
    follow: (userId) => api.post(`/users/${userId}/follow`),
    unfollow: (userId) => api.delete(`/users/${userId}/follow`),
  };
}