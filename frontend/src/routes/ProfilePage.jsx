import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createFollowerService } from '../services/followerService';
import { LogOut, Users } from 'lucide-react';

const ROLE_LABELS = { 1: 'Admin', 2: 'Membre' };

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const { getAccessTokenSilently } = useAuth0();
    const [stats, setStats] = useState({ followers: 0, following: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) { setLoading(false); return; }
        const service = createFollowerService(getAccessTokenSilently);
        service.getFollowStats(user.id)
            .then(setStats)
            .catch((err) => console.error('Erreur follow-stats:', err))
            .finally(() => setLoading(false));
    }, [user?.id]);

    if (loading) return <div className="page-container">Chargement...</div>;
    if (!user) return <div className="page-container">Impossible de charger le profil.</div>;

    const roleLabel = ROLE_LABELS[user.role_id] || 'Membre';

    return (
        <div className="page-container">
            <div className="profile-card-large">
                <div className="profile-header-bg"></div>
                <div className="profile-content">
                    <img src={user.photo} alt="Avatar" className="profile-avatar-lg" />
                    <h1>{user.prenom} {user.nom}</h1>
                    <h3 className="pseudo">@{user.pseudo}</h3>
                    <div className="stats-row">
                        <Link to={`/followers/${user.id}?tab=followers`} className="stat" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                            <span className="val">{stats.followers}</span>
                            <span className="label">Abonnés</span>
                        </Link>
                        <Link to={`/followers/${user.id}?tab=following`} className="stat" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                            <span className="val">{stats.following}</span>
                            <span className="label">Abonnements</span>
                        </Link>
                        <div className="stat">
                            <span className="val">{roleLabel}</span>
                            <span className="label">Rôle</span>
                        </div>
                    </div>
                    <div className="bio-section">
                        <h4>Bio</h4>
                        <p>{user.bio}</p>
                    </div>
                    <div className="info-section">
                        <p><strong>Email :</strong> {user.email}</p>
                        <p><strong>Inscrit le :</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={logout} className="btn-danger full-width">
                        <LogOut size={16}/> Se déconnecter
                    </button>
                </div>
            </div>
        </div>
    );
}