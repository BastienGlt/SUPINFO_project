import { createApiClient } from './apiClient';

export function createFeedService(getAccessTokenSilently) {
  const api = createApiClient(getAccessTokenSilently);
  return {
    getFeed: (limit = 20, offset = 0) => api.get(`/feed?limit=${limit}&offset=${offset}`),
  };
}