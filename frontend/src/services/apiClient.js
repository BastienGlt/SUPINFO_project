const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function createApiClient(getAccessTokenSilently) {
  async function request(endpoint, options = {}) {
    const token = await getAccessTokenSilently();
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur serveur');
    return data;
  }

  return {
    get: (endpoint) => request(endpoint),
    post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  };
}

