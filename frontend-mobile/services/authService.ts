import { apiFetch } from './apiService';

export interface AppUser {
  id: number;
  auth0_id: string;
  prenom: string;
  nom: string;
  pseudo: string;
  bio: string;
  photo: string;
  email: string;
  role_id: number;
  status: string;
  public: number; // 1 = public, 0 = privé
  created_at: string;
  is_private?: boolean; // présent quand on consulte un compte privé
}

export const authService = {
  /**
   * GET /users/me — vérifie si l'utilisateur Auth0 existe en base.
   */
  getMe: async (token: string): Promise<{ exists: true; user: AppUser } | { exists: false; prefill?: object }> => {
    try {
      const user = await apiFetch<AppUser>('/users/me', { token });
      return { exists: true, user };
    } catch (err: unknown) {
      const error = err as { status?: number; is_new?: boolean; prefill?: object };
      if (error.status === 404 && error.is_new) {
        return { exists: false, prefill: error.prefill };
      }
      throw err;
    }
  },

  /**
   * POST /users/create — crée le profil lors de la première connexion.
   */
  createProfile: async (
    token: string,
    data: { prenom: string; nom: string; pseudo: string; bio: string }
  ): Promise<AppUser> => {
    return apiFetch<AppUser>('/users/create', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  },

  /**
   * PUT /users/:id — met à jour le profil.
   */
  updateProfile: async (
    token: string,
    userId: number,
    updates: Partial<Pick<AppUser, 'prenom' | 'nom' | 'pseudo' | 'bio' | 'public'>>
  ): Promise<AppUser> => {
    return apiFetch<AppUser>(`/users/${userId}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(updates),
    });
  },

  /**
   * GET /users/:id — profil public d'un utilisateur.
   */
  getUserById: async (id: number): Promise<AppUser> => {
    return apiFetch<AppUser>(`/users/${id}`);
  },
};
