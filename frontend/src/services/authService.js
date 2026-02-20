import bcrypt from 'bcryptjs';
import { DB } from './mockDb';

export const authService = {
    // Initialise le mot de passe pour le test
    prepareMockHash: async () => {
        const salt = await bcrypt.genSalt(10);
        // On cible l'ID 1 (GamerPro123)
        const user = DB.users.find(u => u.id === 1);
        if(user) user.password_hash = await bcrypt.hash('password123', salt);
    },

    login: async (pseudo, password) => {
        const user = DB.users.find(u => u.pseudo === pseudo);
        if (!user) throw new Error("Pseudo incorrect");

        // Si le hash est vide (cas de mock non init), on le force
        if (!user.password_hash) await authService.prepareMockHash();

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) throw new Error("Mot de passe incorrect");

        const token = authService.generateToken(user);
        const { password_hash, ...safeUser } = user;
        return { user: safeUser, token };
    },

    generateToken: (user) => {
        const payload = btoa(JSON.stringify({ sub: user.id, exp: Date.now() + 7200000 }));
        return `jswauthent.${payload}.signature`;
    },

    verifyToken: (token) => {
        if (!token?.startsWith('jswauthent.')) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return Date.now() > payload.exp ? null : payload;
        } catch { return null; }
    }
};