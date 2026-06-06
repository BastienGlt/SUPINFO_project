import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../hooks/useAuth';
import { createFollowerService } from '../services/followerService';
import { getPublicUser } from '../services/userService';
import { Users } from 'lucide-react';

export default function FollowListPage() {
    const { userId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab') || 'followers';
    const { user, isAuthenticated } = useAuth();
    const { getAccessTokenSilently } = useAuth0();

    const [profileUser, setProfileUser] = useState(null);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const profile = await getPublicUser(userId);
                setProfileUser(profile);

                const service = createFollowerService(getAccessTokenSilently);

                const followersRaw = await service.getFollowers(userId).catch(() => []);
                const followingRaw = await service.getFollowing(userId).catch(() => []);

                // Debug : voir la structure exacte
                console.log('Followers brut:', followersRaw);
                console.log('Following brut:', followingRaw);

       
                const normalizeList = (data) => {
                    if (Array.isArray(data)) return data;
                    if (Array.isArray(data?.followers)) return data.followers;
                    if (Array.isArray(data?.following)) return data.following;
                    if (Array.isArray(data?.data)) return data.data;
                    if (Array.isArray(data?.users)) return data.users;
                    return [];
                };

                setFollowers(normalizeList(followersRaw));
                setFollowing(normalizeList(followingRaw));
            } catch (err) {
                console.error('Erreur:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [userId]);

    const list = tab === 'followers' ? followers : following;

    const getPersonId = (person) => {
   
        if (tab === 'followers') return person.follower_id;
        return person.followed_id;
    };

    const getPersonName = (person) => {
        if (tab === 'followers') return person.follower_pseudo || `${person.follower_prenom} ${person.follower_nom}`;
        return person.followed_pseudo || `${person.followed_prenom} ${person.followed_nom}`;
    };



    if (loading) return <div className="page-container">Chargement...</div>;

    return (
        <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <Users size={24} style={{ color: 'var(--primary)' }} />
                <h1 style={{ fontSize: '1.5rem' }}>
                    {profileUser?.pseudo || 'Utilisateur'}
                </h1>
            </div>

            <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)' }}>
                <button
                    onClick={() => setSearchParams({ tab: 'followers' })}
                    style={{
                        padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer',
                        color: tab === 'followers' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem',
                        borderBottom: tab === 'followers' ? '2px solid var(--primary)' : '2px solid transparent',
                        marginBottom: '-2px',
                    }}
                >
                    Abonnés ({followers.length})
                </button>
                <button
                    onClick={() => setSearchParams({ tab: 'following' })}
                    style={{
                        padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer',
                        color: tab === 'following' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem',
                        borderBottom: tab === 'following' ? '2px solid var(--primary)' : '2px solid transparent',
                        marginBottom: '-2px',
                    }}
                >
                    Abonnements ({following.length})
                </button>
            </div>

            {list.length === 0 ? (
                <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '2rem', textAlign: 'center',
                }}>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {tab === 'followers' ? 'Aucun abonné.' : 'Aucun abonnement.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {list.map((person, index) => {
                        const pid = getPersonId(person);
                        return (
                            <Link
                                to={pid ? `/user/${pid}` : '#'}
                                key={pid || index}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '14px',
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderRadius: '10px', padding: '14px 18px',
                                    textDecoration: 'none', transition: 'border-color 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                            >
                                {person.photo ? (
                                    <img src={person.photo} alt="" style={{
                                        width: '44px', height: '44px', borderRadius: '50%',
                                        border: '2px solid var(--border-light)', objectFit: 'cover',
                                    }} />
                                ) : (
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '50%',
                                        background: 'var(--primary-glow)', border: '2px solid var(--primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem',
                                    }}>
                                        {getPersonName(person)[0].toUpperCase()}
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem' }}>
                                        {getPersonName(person)}
                                    </div>
                                    {person.bio && (
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px',
                                        }}>
                                            {person.bio}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}