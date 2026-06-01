import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Heart, MessageCircle, Star, TrendingUp, Gamepad2 } from 'lucide-react';
import AdvancedSearch from '../components/AdvancedSearch';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function HomePage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [critiques, setCritiques] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const allCritiques = [];
                const ids = Array.from({ length: 50 }, (_, i) => i + 1);
                const results = await Promise.all(
                    ids.map(id =>
                        fetch(`${API_URL}/critiques/${id}/ratings`, { headers: { 'Content-Type': 'application/json' } })
                        .then(res => res.ok ? res.json() : null)
                        .catch(() => null)
                    )
                );
                for (let i = 0; i < results.length; i++) {
                    if (!results[i]) continue;
                    const list = Array.isArray(results[i]) ? results[i]
                        : Array.isArray(results[i]?.critiques) ? results[i].critiques : [];
                    list.forEach(c => { c._loaded_oeuvre_id = ids[i]; });
                    allCritiques.push(...list);
                }
                setCritiques(allCritiques.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20));
            } catch (err) { console.error('Erreur:', err); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const handleClick = (post) => {
        navigate(`/oeuvre/${post._loaded_oeuvre_id || post.oeuvre_id}`);
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
                        ? 'Voici les derniers avis de la communauté.'
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

            {/* RECHERCHE AVANCÉE */}
            <AdvancedSearch />

            {/* DERNIERS AVIS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
                <h2 style={{ color: 'var(--text)', fontSize: '1.3rem' }}>Derniers avis</h2>
            </div>

            {loading ? (
                <div className="page-container">Chargement des avis...</div>
            ) : critiques.length === 0 ? (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Aucun avis pour le moment.</p>
                </div>
            ) : (
                <div className="grid">
                    {critiques.map((post, index) => (
                        <div key={post.id || index} className="card" style={{ cursor: 'pointer' }} onClick={() => handleClick(post)}>
                            <div className="card-header">
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ color: 'white', fontSize: '1.1rem' }}>{post.oeuvre_titre || post.titre || 'Sans titre'}</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        par <span style={{ color: 'var(--primary)' }}>{post.pseudo || post.prenom || 'Anonyme'}</span>
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
                    ))}
                </div>
            )}
        </div>
    );
}