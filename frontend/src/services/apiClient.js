const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function createApiClient(getAccessTokenSilently) {
  async function request(endpoint, options = {}) {
    const token = await getAccessTokenSilently();
    const headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };
    if (options.body !== undefined && options.body !== null) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Erreur serveur');
    return data;
  }

  return {
    get: (endpoint) => request(endpoint),
    post: (endpoint, body) => request(endpoint, {
      method: 'POST',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),
    put: (endpoint, body) => request(endpoint, {
      method: 'PUT',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),
    patch: (endpoint, body) => request(endpoint, {
      method: 'PATCH',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  };
}