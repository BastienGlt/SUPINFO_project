import React, { createContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const {
    isAuthenticated,
    isLoading,
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();

  const [appUser, setAppUser] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      setAppUser(null);
      setIsNewUser(false);
      setUserLoading(false);
      return;
    }

    const fetchUser = async () => {
      setUserLoading(true);
      try {
        const result = await authService.getMe(getAccessTokenSilently);
        if (result.exists) {
          setAppUser(result.user);
          setIsNewUser(false);
        } else {
          setAppUser(null);
          setIsNewUser(true);
          sessionStorage.setItem('auth0_prefill', JSON.stringify(result.prefill || {}));
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du profil:', err);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, [isAuthenticated, isLoading]);

  const login = () => loginWithRedirect();

  const logout = () => {
    setAppUser(null);
    setIsNewUser(false);
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const completeProfile = async (profileData) => {
    const newUser = await authService.createProfile(getAccessTokenSilently, profileData);
    setAppUser(newUser);
    setIsNewUser(false);
    sessionStorage.removeItem('auth0_prefill');
    return newUser;
  };

  const updateUser = async (userId, updates) => {
    const updated = await authService.updateProfile(getAccessTokenSilently, userId, updates);
    setAppUser(updated);
    return updated;
  };

  const loading = isLoading || userLoading;

  return (
    <AuthContext.Provider value={{ user: appUser, isNewUser, login, logout, loading, completeProfile, updateUser }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
