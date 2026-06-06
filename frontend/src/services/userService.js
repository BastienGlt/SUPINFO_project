import { createApiClient } from './apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


export async function getPublicUser(userId) {
    const res = await fetch(`${API_URL}/users/${userId}`, {
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Utilisateur introuvable');
    return await res.json();
}

export function createUserService(getAccessTokenSilently) {
    const api = createApiClient(getAccessTokenSilently);
    return {
        getUser: (userId) => api.get(`/users/${userId}`),
        getUserRatings: (userId) => api.get(`/users/${userId}/ratings`),
    };
}