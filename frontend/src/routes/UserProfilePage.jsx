import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../hooks/useAuth';
import { getPublicUser } from '../services/userService';
import { createFollowerService } from '../services/followerService';
import { UserPlus, UserMinus, Star, Lock, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function UserProfilePage() {
    const { userId } = useParams();
    const { user, isAuthenticated } = useAuth();
    const { getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ followers: 0, following: 0 });
    const [isFollowing, setIsFollowing] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        if (user && String(user.id) === String(userId)) {
            navigate('/profile', { replace: true });
        }
    }, [user, userId]);

    useEffect(() => {
        const load = async () => {
            try {
                // Charger le profil 
                const profileData = await getPublicUser(userId);
                setProfile(profileData);

                // Stats de follow
                try {
                    const service = createFollowerService(getAccessTokenSilently);
                    const s = await service.getFollowStats(userId);
                    setStats(s);
                } catch (err) {
                    
                    if (err.message?.includes('privé')) setStats({ followers: '?', following: '?' });
                }

                
                if (isAuthenticated) {
                    try {
                        const service = createFollowerService(getAccessTokenSilently);
                        const result = await service.isFollowing(userId);
                        setIsFollowing(result.isFollowing || false);
                    } catch {}
                }

               
                if (!profileData.is_private) {
                    try {
                        const res = await fetch(`${API_URL}/users/${userId}/ratings`, {
                            headers: { 'Content-Type': 'application/json' },
                        });
                        if (res.ok) {
                            const data = await res.json();
                            setRatings(Array.isArray(data) ? data : data?.ratings || data?.critiques || []);
                        }
                    } catch {}
                }
            } catch (err) { console.error('Erreur profil:', err); }
            finally { setLoading(false); }
        };
        load();
    }, [userId, isAuthenticated]);

    const handleFollow = async () => {
        setFollowLoading(true);
        try {
            const service = createFollowerService(getAccessTokenSilently);
            if (isFollowing) {
                await service.unfollow(userId);
                setIsFollowing(false);
                setStats(s => ({ ...s, followers: Math.max(0, (parseInt(s.followers) || 0) - 1) }));
            } else {
                try {
                    const result = await service.follow(userId);
                    // 201 = follow direct (public), 202 = demande envoyée (privé)
                    if (result.status === 'pending') {
                        setIsPending(true);
                    } else {
                        setIsFollowing(true);
                        setStats(s => ({ ...s, followers: (parseInt(s.followers) || 0) + 1 }));
                    }
                } catch (err) {
                    if (err.message?.includes('Déjà') || err.message?.includes('409')) {
                        setIsFollowing(true);
                    } else if (err.message?.includes('attente') || err.message?.includes('pending')) {
                        setIsPending(true);
                    } else {
                        alert('Erreur : ' + err.message);
                    }
                }
            }
        } catch (err) { alert('Erreur : ' + err.message); }
        finally { setFollowLoading(false); }
    };

    if (loading) return <div className="page-container">Chargement...</div>;
    if (!profile) return <div className="page-container">Utilisateur introuvable.</div>;

    const isPrivate = profile.is_private || profile.public === 0;

    // ═══ PROFIL PRIVÉ (pas d'accès) ═══
    if (isPrivate && !isFollowing) {
        return (
            <div className="page-container">
                <div className="profile-card-large">
                    <div className="profile-header-bg"></div>
                    <div className="profile-content" style={{ textAlign: 'center' }}>
                        {profile.photo ? (
                            <img src={profile.photo} alt="Avatar" className="profile-avatar-lg" style={{ filter: 'blur(3px)', opacity: 0.6 }} />
                        ) : (
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Lock size={40} style={{ color: 'var(--text-muted)' }} />
                            </div>
                        )}
                        <h1>@{profile.pseudo}</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{profile.prenom} {profile.nom}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '1rem 0' }}>
                            <Lock size={14} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ce compte est privé</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Envoyez une demande d'abonnement pour voir les publications de cet utilisateur.
                        </p>
                        {isAuthenticated && (
                            <button onClick={handleFollow} disabled={followLoading}
                                style={{
                                    background: isPending ? 'var(--bg)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                                    border: isPending ? '1px solid var(--border)' : 'none',
                                    borderRadius: '8px', padding: '12px 32px',
                                    color: isPending ? 'var(--text-muted)' : 'white',
                                    fontWeight: 700, cursor: 'pointer',
                                    fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem',
                                    display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto',
                                }}>
                                {isPending ? <><Clock size={16} /> Demande envoyée</> : <><UserPlus size={16} /> Demander à suivre</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ═══ PROFIL COMPLET ═══
    return (
        <div className="page-container">
            <div className="profile-card-large">
                <div className="profile-header-bg"></div>
                <div className="profile-content">
                    {profile.photo && <img src={profile.photo} alt="Avatar" className="profile-avatar-lg" />}
                    <h1>{profile.prenom} {profile.nom}</h1>
                    <h3 className="pseudo">
                        @{profile.pseudo}
                        {isPrivate && <Lock size={14} style={{ color: 'var(--text-muted)', marginLeft: '6px', verticalAlign: 'middle' }} />}
                    </h3>
                    <div className="stats-row">
                        <Link to={`/followers/${userId}?tab=followers`} className="stat" style={{ textDecoration: 'none' }}>
                            <span className="val">{stats.followers}</span><span className="label">Abonnés</span>
                        </Link>
                        <Link to={`/followers/${userId}?tab=following`} className="stat" style={{ textDecoration: 'none' }}>
                            <span className="val">{stats.following}</span><span className="label">Abonnements</span>
                        </Link>
                    </div>
                    {profile.bio && <div className="bio-section"><h4>Bio</h4><p>{profile.bio}</p></div>}

                    {isAuthenticated && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '1rem', justifyContent: 'center' }}>
                            <button onClick={handleFollow} disabled={followLoading}
                                style={{
                                    background: isFollowing ? 'var(--bg)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                                    border: isFollowing ? '1px solid var(--border)' : 'none',
                                    borderRadius: '8px', padding: '10px 24px',
                                    color: isFollowing ? 'var(--danger)' : 'white',
                                    fontWeight: 700, cursor: 'pointer',
                                    fontFamily: 'Rajdhani, sans-serif', fontSize: '0.95rem',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                }}>
                                {isFollowing ? <><UserMinus size={16} /> Se désabonner</> : <><UserPlus size={16} /> Suivre</>}
                            </button>
                        </div>
                    )}

                    {ratings.length > 0 && (
                        <div style={{ marginTop: '2rem', width: '100%' }}>
                            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Star size={18} /> Ses avis ({ratings.length})
                            </h3>
                            {ratings.map(r => (
                                <div key={r.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text)', fontWeight: 700 }}>{r.oeuvre_titre || r.titre}</span>
                                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>{'⭐'.repeat(r.note)} {r.note}/5</span>
                                    </div>
                                    {r.contenu && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>{r.contenu}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}