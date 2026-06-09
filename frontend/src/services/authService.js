const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const authService = {

  getMe: async (getAccessTokenSilently) => {
    const token = await getAccessTokenSilently();
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) return { exists: true, user: data };
    if (res.status === 404 && data.is_new) return { exists: false, prefill: data.prefill };
    throw new Error(data.error || 'Erreur serveur');
  },


  createProfile: async (getAccessTokenSilently, { prenom, nom, pseudo, bio }) => {
    const token = await getAccessTokenSilently();
    const res = await fetch(`${API_URL}/users/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prenom, nom, pseudo, bio }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Impossible de créer le profil');
    return data;
  },


  updateProfile: async (getAccessTokenSilently, userId, updates) => {
    const token = await getAccessTokenSilently();
    const res = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Impossible de mettre à jour le profil');
    return data;
  },
};
