import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '@/constants/api';
import { authService, type AppUser } from '@/services/authService';

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  user: AppUser | null;
  token: string | null;
  isNewUser: boolean;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  completeProfile: (data: { prenom: string; nom: string; pseudo: string; bio: string }) => Promise<void>;
  updateUser: (userId: number, updates: Partial<AppUser>) => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  isNewUser: false,
  loading: true,
  login: async () => {},
  logout: async () => {},
  completeProfile: async () => {},
  updateUser: async () => {},
});

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `https://${CONFIG.AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${CONFIG.AUTH0_DOMAIN}/oauth/token`,
  revocationEndpoint: `https://${CONFIG.AUTH0_DOMAIN}/oidc/logout`,
};

const redirectUri = AuthSession.makeRedirectUri({ scheme: 'frontendmobile', path: 'callback' });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CONFIG.AUTH0_CLIENT_ID,
      responseType: AuthSession.ResponseType.Code,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      redirectUri,
      extraParams: { audience: CONFIG.AUTH0_AUDIENCE },
    },
    discovery
  );

  // Restaurer la session depuis AsyncStorage au démarrage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = await AsyncStorage.getItem('access_token');
        if (stored) {
          const result = await authService.getMe(stored);
          if (result.exists) {
            setUser(result.user);
            setToken(stored);
          } else {
            setIsNewUser(true);
            setToken(stored);
          }
        }
      } catch {
        await AsyncStorage.removeItem('access_token');
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // Gérer la réponse Auth0 après le login
  useEffect(() => {
    if (response?.type !== 'success') return;
    const successResponse = response;

    const exchangeCode = async () => {
      setLoading(true);
      try {
        const code = successResponse.params.code;
        const tokenRes = await fetch(`https://${CONFIG.AUTH0_DOMAIN}/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: CONFIG.AUTH0_CLIENT_ID,
            code_verifier: request?.codeVerifier,
            code,
            redirect_uri: redirectUri,
          }),
        });
        const tokens = await tokenRes.json();

        if (!tokens.access_token) throw new Error('No access token received');

        await AsyncStorage.setItem('access_token', tokens.access_token);
        setToken(tokens.access_token);

        const meResult = await authService.getMe(tokens.access_token);
        if (meResult.exists) {
          setUser(meResult.user);
          setIsNewUser(false);
        } else {
          setIsNewUser(true);
        }
      } catch (err) {
        console.error('Auth error:', err);
      } finally {
        setLoading(false);
      }
    };

    exchangeCode();
  }, [response]);

  const login = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('access_token');
    setUser(null);
    setToken(null);
    setIsNewUser(false);
  }, []);

  const completeProfile = useCallback(
    async (data: { prenom: string; nom: string; pseudo: string; bio: string }) => {
      if (!token) throw new Error('Non authentifié');
      const newUser = await authService.createProfile(token, data);
      setUser(newUser);
      setIsNewUser(false);
    },
    [token]
  );

  const updateUser = useCallback(
    async (userId: number, updates: Partial<AppUser>) => {
      if (!token) throw new Error('Non authentifié');
      const updated = await authService.updateProfile(token, userId, updates as Parameters<typeof authService.updateProfile>[2]);
      setUser(updated);
    },
    [token]
  );

  return (
    <AuthContext.Provider value={{ user, token, isNewUser, loading, login, logout, completeProfile, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
