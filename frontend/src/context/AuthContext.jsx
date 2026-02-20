import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { DB } from '../services/mockDb';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            await authService.prepareMockHash(); // Sécurité Mock
            const token = localStorage.getItem('authToken');
            if (token) {
                const payload = authService.verifyToken(token);
                if (payload) {
                    const u = DB.users.find(u => u.id === payload.sub);
                    if (u) {
                        const { password_hash, ...safe } = u;
                        setUser(safe);
                    }
                } else {
                    localStorage.removeItem('authToken');
                }
            }
            setLoading(false);
        };
        init();
    }, []);

    const login = async (pseudo, pass) => {
        try {
            const res = await authService.login(pseudo, pass);
            localStorage.setItem('authToken', res.token);
            setUser(res.user);
            return { success: true };
        } catch (e) {
            return { success: false, message: e.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};