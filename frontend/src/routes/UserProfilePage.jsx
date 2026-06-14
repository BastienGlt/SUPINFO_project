import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../hooks/useAuth';
import { getPublicUser } from '../services/userService';
import { createFollowerService } from '../services/followerService';
import { UserPlus, UserMinus, Star, Users } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function UserProfilePage() {
    const { userId } = useParams();
    const { user, isAuthenticated } = useAuth();
    const { getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ followers: 0, following: 0 });
    const [isFollowing, setIsFollowing] = useState(false);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);

    // Rediriger vers /profile si c'est son propre profil
    useEffect(() => {
        if (user && String(user.id) === String(userId)) {
            navigate('/profile', { replace: true });
        }
    }, [user, userId]);

    useEffect(() => {
        const load = async () => {
            try {
                const [profileData, statsData] = await Promise.all([
                    getPublicUser(userId),
                    (async () => {
                        try {
                            const service = createFollowerService(getAccessTokenSilently);
                            return await service.getFollowStats(userId);
                        } catch { return { followers: 0, following: 0 }; }
                    })(),
                ]);
                setProfile(profileData);
                setStats(statsData);

                // Charger les critiques publiques de cet utilisateur
                try {
                    const res = await fetch(`${API_URL}/users/${userId}/ratings`, {
                        headers: { 'Content-Type': 'application/json' },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const list = Array.isArray(data) ? data
                            : Array.isArray(data?.ratings) ? data.ratings
                            : Array.isArray(data?.critiques) ? data.critiques
                            : [];
                        setRatings(list.slice(0, 10));
                    }
                } catch {}

                
                // Vérifier si on le suit déjà
                if (isAuthenticated) {
                    try {
                        const service = createFollowerService(getAccessTokenSilently);
                        const following = await service.getFollowing(user.id);
                        const list = Array.isArray(following) ? following : following?.following || [];
                        const alreadyFollows = list.some(f => 
                        String(f.followed_id) === String(userId)
                    );
                        setIsFollowing(alreadyFollows);
                    } catch {}
                    }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
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
            setStats(s => ({ ...s, followers: Math.max(0, s.followers - 1) }));
        } else {
            try {
                await service.follow(userId);
            } catch (err) {
                
                console.log('Follow error (probable doublon):', err.message);
            }
            
            setIsFollowing(true);
            setStats(s => ({ ...s, followers: s.followers + 1 }));
        }
    } catch (err) {
        alert('Erreur : ' + err.message);
    } finally {
        setFollowLoading(false);
    }
    };


    if (loading) return <div className="page-container">Chargement...</div>;
    if (!profile) return <div className="page-container">Utilisateur introuvable.</div>;

    return (
        <div className="page-container">
            <div className="profile-card-large">
                <div className="profile-header-bg"></div>
                <div className="profile-content">
                    {profile.photo ? (
                        <img src={profile.photo} alt="Avatar" className="profile-avatar-lg" />
                    ) : (
                        <div style={{
                            width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto',
                            background: 'var(--primary-glow)', border: '4px solid var(--bg-card)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--primary)', fontSize: '3rem', fontWeight: 900,
                        }}>
                            {(profile.pseudo || '?')[0].toUpperCase()}
                        </div>
                    )}
                    <h1>{profile.prenom} {profile.nom}</h1>
                    <h3 className="pseudo">@{profile.pseudo}</h3>

                    {/* Boutons d'action */}
                    {isAuthenticated && user && String(user.id) !== String(userId) && (
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <button
                                onClick={handleFollow}
                                disabled={followLoading}
                                style={{
                                    background: isFollowing ? 'var(--bg)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                                    border: isFollowing ? '1px solid var(--border)' : 'none',
                                    borderRadius: '8px', padding: '10px 24px',
                                    color: isFollowing ? 'var(--text-muted)' : 'white',
                                    fontWeight: 700, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
                                    fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px',
                                }}
                            >
                                {isFollowing ? <><UserMinus size={16} /> Ne plus suivre</> : <><UserPlus size={16} /> Suivre</>}
                            </button>
                    
                        </div>
                    )}

                    <div className="stats-row">
                        <Link to={`/followers/${userId}?tab=followers`} className="stat" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                            <span className="val">{stats.followers}</span>
                            <span className="label">Abonnés</span>
                        </Link>
                        <Link to={`/followers/${userId}?tab=following`} className="stat" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                            <span className="val">{stats.following}</span>
                            <span className="label">Abonnements</span>
                        </Link>
                    </div>

                    {profile.bio && (
                        <div className="bio-section">
                            <h4>Bio</h4>
                            <p>{profile.bio}</p>
                        </div>
                    )}

                    <div className="info-section">
                        <p><strong>Inscrit le :</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Critiques de l'utilisateur */}
            {ratings.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Star size={20} /> Ses avis
                    </h2>
                    <div className="grid">
                        {ratings.map(r => (
                            <div key={r.id} className="card"
                                 style={{ cursor: r.api_reference_id ? 'pointer' : 'default' }}
                                 onClick={() => r.api_reference_id && navigate(`/game/${r.api_reference_id}`)}>
                                <div className="card-header">
                                    <h3 style={{ color: 'white', fontSize: '1rem' }}>{r.titre || r.oeuvre_titre || 'Jeu'}</h3>
                                    {r.note != null && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            background: 'var(--primary-glow)', border: '1px solid var(--primary)',
                                            borderRadius: '8px', padding: '2px 8px',
                                        }}>
                                            <Star size={12} fill="var(--primary)" color="var(--primary)" />
                                            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>{r.note}/5</span>
                                        </div>
                                    )}
                                </div>
                                {r.contenu && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic',
                                        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                    }}>
                                        "{r.contenu}"
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}