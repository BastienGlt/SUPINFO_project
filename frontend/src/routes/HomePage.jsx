import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../hooks/useAuth';
import { createFeedService } from '../services/feedService';
import { Heart, MessageCircle, Star, TrendingUp, Gamepad2, Users } from 'lucide-react';
import AdvancedSearch from '../components/AdvancedSearch';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function loadPublicCritiques() {
    const res = await fetch(`${API_URL}/critiques/recentes?limit=20`, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

function getAuthorName(post) {
    return post.pseudo || post.user_pseudo || post.auteur_pseudo || post.author_pseudo
        || post.prenom || post.user_prenom || post.auteur || 'Utilisateur';
}

function CritiqueCard({ post, onClick }) {
    return (
        <div className="card" style={{ cursor: 'pointer' }} onClick={onClick}>
            <div className="card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ color: 'var(--text)', fontSize: '1.1rem' }}>
                        {post.oeuvre_titre || post.titre || 'Sans titre'}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        par <span style={{ color: 'var(--primary)' }}>{getAuthorName(post)}</span>
                        {post.created_at && <> · {new Date(post.created_at).toLocaleDateString()}</>}
                    </span>
                </div>
                {post.note != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: '8px', padding: '4px 10px' }}>
                        <Star size={14} fill="var(--primary)" color="var(--primary)" />
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'Rajdhani, sans-serif' }}>{post.note}/5</span>
                    </div>
                )}
            </div>
            {post.contenu && (
                <p style={{ margin: '0.8rem 0', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    "{post.contenu}"
                </p>
            )}
            <div className="card-footer">
                <span className="icon-text"><Heart size={14} /> {post.likes_count || 0}</span>
                <span className="icon-text"><MessageCircle size={14} /> {post.comments_count || 0}</span>
            </div>
        </div>
    );
}

export default function HomePage() {
    const { isAuthenticated } = useAuth();
    const { getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();

    const [feed, setFeed] = useState([]);
    const [critiques, setCritiques] = useState([]);
    const [loadingFeed, setLoadingFeed] = useState(true);
    const [loadingCritiques, setLoadingCritiques] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) { setLoadingFeed(false); return; }
        const load = async () => {
            try {
                const service = createFeedService(getAccessTokenSilently);
                const data = await service.getFeed();
                const list = Array.isArray(data) ? data
                    : Array.isArray(data?.feed) ? data.feed
                    : Array.isArray(data?.activities) ? data.activities
                    : [];
                setFeed(list);
            } catch (err) { console.error('Erreur feed:', err); }
            finally { setLoadingFeed(false); }
        };
        load();
    }, [isAuthenticated]);

    useEffect(() => {
        loadPublicCritiques()
            .then((data) => {
                
                setCritiques(data);
            })
            .catch(err => console.error('Erreur critiques:', err))
            .finally(() => setLoadingCritiques(false));
    }, []);

    const handleClick = (post) => {
        if (post.api_reference_id) navigate(`/oeuvre/${post.api_reference_id}`);
        else if (post.oeuvre_id) navigate(`/oeuvre/${post.oeuvre_id}`);
    };

    const handleFeedClick = (post) => {
        if (post.oeuvre_api_ref || post.api_reference_id) navigate(`/oeuvre/${post.oeuvre_api_ref || post.api_reference_id}`);
        else if (post.oeuvre_id) navigate(`/oeuvre/${post.oeuvre_id}`);
    };

    return (
        <div className="page-container">
            <div className="hero">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Gamepad2 size={32} style={{ color: 'var(--primary)' }} />
                    <h1 style={{ fontSize: '2rem' }}>
                        {isAuthenticated ? 'Bienvenue !' : 'Bienvenue sur ProjetSupinfo'}
                    </h1>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                    {isAuthenticated
                        ? 'Voici les dernières activités de la communauté.'
                        : 'Découvrez les derniers avis de la communauté gaming. Connectez-vous pour participer !'}
                </p>
                {!isAuthenticated && (
                    <Link to="/login" style={{
                        display: 'inline-block', marginTop: '1rem',
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                        color: 'white', padding: '10px 24px', borderRadius: '8px',
                        textDecoration: 'none', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif',
                    }}>
                        Rejoindre la communauté
                    </Link>
                )}
            </div>

            <AdvancedSearch />

            {isAuthenticated && (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                        <Users size={20} style={{ color: 'var(--primary)' }} />
                        <h2 style={{ color: 'var(--text)', fontSize: '1.3rem' }}>Fil d'actualité</h2>
                    </div>
                    {loadingFeed ? (
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Chargement du fil...</p>
                    ) : feed.length === 0 ? (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
                            <p style={{ color: 'var(--text-muted)' }}>Aucune activité de tes abonnements.</p>
                        </div>
                    ) : (
                        <div className="grid" style={{ marginBottom: '2rem' }}>
                            {feed.map((post, index) => (
                                <CritiqueCard key={post.id || `feed-${index}`} post={post} onClick={() => handleFeedClick(post)} />
                            ))}
                        </div>
                    )}
                </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
                <h2 style={{ color: 'var(--text)', fontSize: '1.3rem' }}>Derniers avis</h2>
            </div>

            {loadingCritiques ? (
                <p style={{ color: 'var(--text-muted)' }}>Chargement des avis...</p>
            ) : critiques.length === 0 ? (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Aucun avis pour le moment.</p>
                </div>
            ) : (
                <div className="grid">
                    {critiques.map((post, index) => (
                        <CritiqueCard key={post.id || `pub-${index}`} post={post} onClick={() => handleClick(post)} />
                    ))}
                </div>
            )}
        </div>
    );
}