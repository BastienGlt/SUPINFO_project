import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createFollowerService } from '../services/followerService';
import { createApiClient } from '../services/apiClient';
import { LogOut, Shield, Lock, Globe, Check, X } from 'lucide-react';

const ROLE_LABELS = { 1: 'Membre', 2: 'Modérateur', 3: 'Administrateur' };

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const { getAccessTokenSilently } = useAuth0();
    const [stats, setStats] = useState({ followers: 0, following: 0 });
    const [loading, setLoading] = useState(true);
    const [isPrivate, setIsPrivate] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);

    useEffect(() => {
        if (!user?.id) { setLoading(false); return; }

        const loadData = async () => {
            try {
                const service = createFollowerService(getAccessTokenSilently);
                const s = await service.getFollowStats(user.id);
                setStats(s);
            } catch {}

            // Lire le statut public/privé depuis le profil
            setIsPrivate(user.public === 0);

            // Charger les demandes de follow en attente
            try {
                const service = createFollowerService(getAccessTokenSilently);
                const requests = await service.getFollowRequests();
                setPendingRequests(Array.isArray(requests) ? requests : []);
            } catch {}

            setLoading(false);
        };
        loadData();
    }, [user?.id]);

    const togglePrivacy = async () => {
        const newValue = !isPrivate;
        try {
            const api = createApiClient(getAccessTokenSilently);
            await api.put(`/users/${user.id}`, { public: newValue ? 0 : 1 });
            setIsPrivate(newValue);
        } catch (err) {
            alert('Erreur : ' + err.message);
        }
    };

    const handleAccept = async (requestId) => {
        try {
            const service = createFollowerService(getAccessTokenSilently);
            await service.handleFollowRequest(requestId, 'accept');
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (err) { alert('Erreur : ' + err.message); }
    };

    const handleReject = async (requestId) => {
        try {
            const service = createFollowerService(getAccessTokenSilently);
            await service.handleFollowRequest(requestId, 'reject');
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (err) { alert('Erreur : ' + err.message); }
    };

    if (loading) return <div className="page-container">Chargement...</div>;
    if (!user) return <div className="page-container">Impossible de charger le profil.</div>;

    const roleLabel = ROLE_LABELS[user.role_id] || 'Membre';
    const isModOrAdmin = user.role_id >= 2;

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
                            <span className="val">{stats.followers}</span><span className="label">Abonnés</span>
                        </Link>
                        <Link to={`/followers/${user.id}?tab=following`} className="stat" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                            <span className="val">{stats.following}</span><span className="label">Abonnements</span>
                        </Link>
                        <div className="stat">
                            <span className="val" style={{ color: isModOrAdmin ? 'var(--accent)' : 'var(--primary)' }}>{roleLabel}</span><span className="label">Rôle</span>
                        </div>
                    </div>
                    <div className="bio-section"><h4>Bio</h4><p>{user.bio || 'Aucune bio.'}</p></div>
                    <div className="info-section">
                        <p><strong>Email :</strong> {user.email}</p>
                        <p><strong>Inscrit le :</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>

                    {/* Paramètres de confidentialité */}
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem', marginBottom: '1rem' }}>
                        <h4 style={{ color: 'var(--text)', marginBottom: '0.8rem', fontFamily: 'Rajdhani, sans-serif', fontSize: '1.1rem' }}>Paramètres du compte</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {isPrivate ? <Lock size={18} style={{ color: 'var(--warning)' }} /> : <Globe size={18} style={{ color: 'var(--success)' }} />}
                                <div>
                                    <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem' }}>Compte {isPrivate ? 'privé' : 'public'}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{isPrivate ? 'Les demandes d\'abonnement doivent être approuvées.' : 'Tout le monde peut voir votre profil et vous suivre.'}</div>
                                </div>
                            </div>
                            <button onClick={togglePrivacy} style={{ width: '50px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer', background: isPrivate ? 'var(--primary)' : 'var(--border)', position: 'relative', transition: 'background 0.2s' }}>
                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: isPrivate ? '25px' : '3px', transition: 'left 0.2s' }} />
                            </button>
                        </div>
                    </div>

                    {/* Demandes en attente */}
                    {pendingRequests.length > 0 && (
                        <div style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: '12px', padding: '1.2rem', marginBottom: '1rem' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '0.8rem', fontFamily: 'Rajdhani, sans-serif', fontSize: '1.1rem' }}>
                                Demandes d'abonnement ({pendingRequests.length})
                            </h4>
                            {pendingRequests.map(req => (
                                <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                    <Link to={`/user/${req.requester_id}`} style={{ color: 'var(--text)', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
                                        @{req.pseudo}
                                    </Link>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={() => handleAccept(req.id)} style={{ background: '#14532d', color: '#4ade80', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                                            <Check size={14} /> Accepter
                                        </button>
                                        <button onClick={() => handleReject(req.id)} style={{ background: '#7f1d1d', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                                            <X size={14} /> Refuser
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {isModOrAdmin && (
                        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '0.8rem', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem', marginBottom: '0.5rem' }}>
                            <Shield size={18} /> Panneau d'administration
                        </Link>
                    )}
                    <button onClick={logout} className="btn-danger full-width"><LogOut size={16}/> Se déconnecter</button>
                </div>
            </div>
        </div>
    );
}