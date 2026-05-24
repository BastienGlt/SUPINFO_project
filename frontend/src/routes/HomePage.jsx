import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Heart, MessageCircle, Star, TrendingUp, Gamepad2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function publicFetch(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
}

async function loadPublicCritiques() {
    const critiques = [];

    // Tenter de charger les critiques des oeuvres 1 à 20
    const ids = Array.from({ length: 20 }, (_, i) => i + 1);
    const promises = ids.map(id =>
        publicFetch(`/critiques/${id}/ratings`).catch(() => null)
    );
    const results = await Promise.all(promises);

    for (const r of results) {
        if (!r) continue;
        const list = Array.isArray(r) ? r
            : Array.isArray(r?.critiques) ? r.critiques
            : [];
        critiques.push(...list);
    }

    // Trier par date décroissante et garder les 20 plus récentes
    return critiques
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20);
}

export default function HomePage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [critiques, setCritiques] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPublicCritiques()
            .then(setCritiques)
            .catch(err => console.error('Erreur chargement avis:', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-container">Chargement...</div>;

    return (
        <div className="page-container">
            {/* Hero */}
            <div className="hero">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Gamepad2 size={32} style={{ color: 'var(--primary)' }} />
                    <h1 style={{ fontSize: '2rem' }}>
                        {isAuthenticated ? 'Bienvenue !' : 'Bienvenue sur ProjetSupinfo'}
                    </h1>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                    {isAuthenticated
                        ? 'Voici les derniers avis de la communauté.'
                        : 'Découvrez les derniers avis de la communauté gaming. Connectez-vous pour participer !'}
                </p>
                {!isAuthenticated && (
                    <Link to="/login" style={{
                        display: 'inline-block', marginTop: '1rem',
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                        color: 'white', padding: '10px 24px', borderRadius: '8px',
                        textDecoration: 'none', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif',
                        fontSize: '1rem',
                    }}>
                        Rejoindre la communauté
                    </Link>
                )}
            </div>

            {/* Section avis */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
                <h2 style={{ color: 'var(--text)', fontSize: '1.3rem' }}>Derniers avis</h2>
            </div>

            {critiques.length === 0 ? (
                <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '3rem', textAlign: 'center',
                }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        Aucun avis pour le moment.
                    </p>
                </div>
            ) : (
                <div className="grid">
                    {critiques.map((post, index) => (
                        <div key={post.id || index} className="card"
                             style={{ cursor: post.api_reference_id ? 'pointer' : 'default' }}
                             onClick={() => {
                                 if (post.api_reference_id) navigate(`/game/${post.api_reference_id}`);
                             }}>
                            <div className="card-header">
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ color: 'white', fontSize: '1.1rem' }}>
                                        {post.titre || post.oeuvre_titre || 'Sans titre'}
                                    </h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        par <span style={{ color: 'var(--primary)' }}>
                                            {post.pseudo || post.author_pseudo || post.prenom || 'Anonyme'}
                                        </span>
                                        {post.created_at && (
                                            <> · {new Date(post.created_at).toLocaleDateString()}</>
                                        )}
                                    </span>
                                </div>
                                {post.note != null && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        background: 'var(--primary-glow)', border: '1px solid var(--primary)',
                                        borderRadius: '8px', padding: '4px 10px',
                                    }}>
                                        <Star size={14} fill="var(--primary)" color="var(--primary)" />
                                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'Rajdhani, sans-serif' }}>
                                            {post.note}/5
                                        </span>
                                    </div>
                                )}
                            </div>

                            {post.contenu && (
                                <p style={{
                                    margin: '0.8rem 0', fontStyle: 'italic', color: 'var(--text-muted)',
                                    fontSize: '0.9rem', lineHeight: 1.6,
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                                }}>
                                    "{post.contenu}"
                                </p>
                            )}

                            <div className="card-footer">
                                <span className="icon-text">
                                    <Heart size={14} /> {post.likes_count || 0}
                                </span>
                                <span className="icon-text">
                                    <MessageCircle size={14} /> {post.comments_count || post.commentaires_count || 0}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}