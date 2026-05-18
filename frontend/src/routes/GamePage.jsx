import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../hooks/useAuth';
import { rawgService } from '../services/rawgService';
import { createCritiqueService } from '../services/critiqueService';
import { createCommentaireService } from '../services/commentaireService';
import { createBibliothequeService } from '../services/bibliothequeService';
import { Star, Heart, MessageCircle, Plus, Send, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Composant étoiles cliquables ───
function StarRating({ value, onChange, readOnly = false, size = 20 }) {
    const [hover, setHover] = useState(0);
    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    size={size}
                    fill={i <= (hover || value) ? '#e87a20' : 'transparent'}
                    color={i <= (hover || value) ? '#e87a20' : '#4a5568'}
                    style={{ cursor: readOnly ? 'default' : 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={() => !readOnly && setHover(i)}
                    onMouseLeave={() => !readOnly && setHover(0)}
                    onClick={() => !readOnly && onChange(i)}
                />
            ))}
        </div>
    );
}

// ─── Composant commentaires sous une critique ───
function CommentSection({ critiqueId, getAccessTokenSilently, isAuthenticated }) {
    const [comments, setComments] = useState([]);
    const [open, setOpen] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    const loadComments = async () => {
        try {
            const service = createCommentaireService(getAccessTokenSilently);
            const data = await service.getByRating(critiqueId);
            setComments(data.commentaires || data || []);
        } catch (err) {
            console.error('Erreur commentaires:', err);
        }
    };

    useEffect(() => {
        if (open) loadComments();
    }, [open]);

    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        setLoading(true);
        try {
            const service = createCommentaireService(getAccessTokenSilently);
            await service.create(critiqueId, newComment.trim());
            setNewComment('');
            await loadComments();
        } catch (err) {
            alert('Erreur : ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '8px' }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px',
                    fontFamily: 'Exo 2, sans-serif',
                }}
            >
                <MessageCircle size={14} />
                Commentaires
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {open && (
                <div style={{ marginTop: '8px', paddingLeft: '12px', borderLeft: '2px solid var(--border)' }}>
                    {comments.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Aucun commentaire.</p>
                    )}
                    {comments.map(c => (
                        <div key={c.id} style={{
                            padding: '8px 0', borderBottom: '1px solid var(--border)',
                            fontSize: '0.85rem',
                        }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{c.pseudo || c.prenom || 'Utilisateur'}</span>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '0.75rem' }}>
                                {new Date(c.created_at).toLocaleDateString()}
                            </span>
                            <p style={{ marginTop: '4px', color: 'var(--text)' }}>{c.contenu}</p>
                        </div>
                    ))}

                    {isAuthenticated && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <input
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Répondre..."
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                style={{
                                    flex: 1, background: 'var(--bg)', border: '1px solid var(--border)',
                                    borderRadius: '6px', padding: '6px 10px', color: 'var(--text)',
                                    fontSize: '0.85rem', fontFamily: 'Exo 2, sans-serif', outline: 'none',
                                }}
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                style={{
                                    background: 'var(--primary)', border: 'none', borderRadius: '6px',
                                    padding: '6px 12px', cursor: 'pointer', color: 'white',
                                    display: 'flex', alignItems: 'center',
                                }}
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Page principale du jeu ───
export default function GamePage() {
    const { rawgId } = useParams();
    const { user, isAuthenticated } = useAuth();
    const { getAccessTokenSilently } = useAuth0();

    const [game, setGame] = useState(null);
    const [screenshots, setScreenshots] = useState([]);
    const [loading, setLoading] = useState(true);

    // Bibliothèque
    const [inLibrary, setInLibrary] = useState(false);
    const [libraryStatut, setLibraryStatut] = useState(null);
    const [oeuvreId, setOeuvreId] = useState(null);

    // Critiques
    const [ratings, setRatings] = useState([]);
    const [ratingStats, setRatingStats] = useState(null);
    const [myRating, setMyRating] = useState(null);

    // Formulaire critique
    const [showForm, setShowForm] = useState(false);
    const [formNote, setFormNote] = useState(0);
    const [formContenu, setFormContenu] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // ── Charger les données RAWG ──
    useEffect(() => {
        const load = async () => {
            try {
                const [gameData, screens] = await Promise.all([
                    rawgService.getGameDetails(rawgId),
                    rawgService.getGameScreenshots(rawgId),
                ]);
                setGame(gameData);
                setScreenshots(screens.slice(0, 4));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [rawgId]);

    // ── Trouver l'oeuvre_id dans la bibliothèque de l'utilisateur ──
    useEffect(() => {
        if (!isAuthenticated || !rawgId) return;
        const findOeuvre = async () => {
            try {
                const bibService = createBibliothequeService(getAccessTokenSilently);
                const items = await bibService.getItems();
                const match = items.find(i => String(i.api_reference_id) === String(rawgId));
                if (match) {
                    setOeuvreId(match.oeuvre_id);
                    setInLibrary(true);
                    setLibraryStatut(match.statut);
                }
            } catch (err) {
                console.error('Erreur lookup biblio:', err);
            }
        };
        findOeuvre();
    }, [isAuthenticated, rawgId]);

    // ── Charger les critiques quand on a l'oeuvre_id ──
    useEffect(() => {
        if (!oeuvreId) return;
        const loadRatings = async () => {
            try {
                const critiqueService = createCritiqueService(getAccessTokenSilently);
                const [ratingsData, stats] = await Promise.all([
                    critiqueService.getRatings(oeuvreId),
                    critiqueService.getRatingStats(oeuvreId),
                ]);
                const list = ratingsData.ratings || ratingsData || [];
                setRatings(list);
                setRatingStats(stats);
                if (user) {
                    const mine = list.find(r => r.user_id === user.id);
                    if (mine) setMyRating(mine);
                }
            } catch (err) {
                console.error('Erreur critiques:', err);
            }
        };
        loadRatings();
    }, [oeuvreId, user]);

    // ── Ajouter à la bibliothèque ──
    const handleAddToBiblio = async (statut) => {
    try {
        const bibService = createBibliothequeService(getAccessTokenSilently);
        await bibService.addItem({
            api_reference_id: String(rawgId),
            titre: game.name,
            description: game.description_raw || 'Pas de description',
        }, statut);
        setInLibrary(true);
        setLibraryStatut(statut);
        const items = await bibService.getItems();
        const match = items.find(i => String(i.api_reference_id) === String(rawgId));
        if (match) setOeuvreId(match.oeuvre_id);
    } catch (err) {
        alert('Erreur : ' + err.message);
    }
    };

    // ── Soumettre une critique ──
    const handleSubmitRating = async () => {
        if (formNote === 0) return alert('Choisis une note');
        if (!oeuvreId) return alert('Ajoute d\'abord le jeu à ta bibliothèque');
        setSubmitting(true);
        try {
            const critiqueService = createCritiqueService(getAccessTokenSilently);
            if (myRating) {
                await critiqueService.updateRating(oeuvreId, formNote, formContenu);
            } else {
                await critiqueService.createRating(oeuvreId, formNote, formContenu);
            }
            // Recharger
            const [ratingsData, stats] = await Promise.all([
                critiqueService.getRatings(oeuvreId),
                critiqueService.getRatingStats(oeuvreId),
            ]);
            const list = ratingsData.ratings || ratingsData || [];
            setRatings(list);
            setRatingStats(stats);
            const mine = list.find(r => r.user_id === user.id);
            if (mine) setMyRating(mine);
            setShowForm(false);
        } catch (err) {
            alert('Erreur : ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Like une critique ──
    const handleLike = async (ratingId) => {
        try {
            const critiqueService = createCritiqueService(getAccessTokenSilently);
            await critiqueService.likeRating(ratingId);
            // Mettre à jour localement
            setRatings(prev => prev.map(r =>
                r.id === ratingId ? { ...r, likes_count: (r.likes_count || 0) + 1, liked: true } : r
            ));
        } catch (err) {
            // Peut-être déjà liké → unlike
            try {
                const critiqueService = createCritiqueService(getAccessTokenSilently);
                await critiqueService.unlikeRating(ratingId);
                setRatings(prev => prev.map(r =>
                    r.id === ratingId ? { ...r, likes_count: Math.max(0, (r.likes_count || 1) - 1), liked: false } : r
                ));
            } catch (e) {
                console.error(e);
            }
        }
    };

    const STATUS_MAP = { 3: 'Envie', 1: 'En cours', 2: 'Terminé' };

    if (loading) return <div className="page-container">Chargement...</div>;
    if (!game) return <div className="page-container">Jeu introuvable.</div>;

    return (
        <div className="page-container">
            {/* ── HERO ── */}
            <div style={{
                position: 'relative', borderRadius: '16px', overflow: 'hidden',
                marginBottom: '2rem', border: '1px solid var(--border)',
            }}>
                <div style={{
                    height: '300px',
                    backgroundImage: `url(${game.background_image})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                }} />
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(transparent, rgba(10,14,23,0.95))',
                    padding: '3rem 2rem 1.5rem',
                }}>
                    <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>{game.name}</h1>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {game.released && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                📅 {game.released}
                            </span>
                        )}
                        {game.rating > 0 && (
                            <span style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 700 }}>
                                ⭐ {game.rating}/5 RAWG
                            </span>
                        )}
                        {game.genres?.map(g => (
                            <span key={g.id} style={{
                                background: 'var(--primary-glow)', color: 'var(--primary)',
                                padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem',
                                fontWeight: 600, border: '1px solid var(--primary)',
                            }}>
                                {g.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
                {/* ── COLONNE GAUCHE ── */}
                <div>
                    {/* Description */}
                    <div style={{
                        background: 'var(--bg-card)', borderRadius: '12px',
                        border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem',
                    }}>
                        <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.3rem' }}>Description</h2>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.9rem' }}>
                            {game.description_raw || 'Aucune description disponible.'}
                        </p>
                    </div>

                    {/* Screenshots */}
                    {screenshots.length > 0 && (
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1.5rem',
                        }}>
                            {screenshots.map((s, i) => (
                                <img key={i} src={s.image} alt=""
                                    style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', height: '140px' }}
                                />
                            ))}
                        </div>
                    )}

                    {/* ── CRITIQUES ── */}
                    <div style={{
                        background: 'var(--bg-card)', borderRadius: '12px',
                        border: '1px solid var(--border)', padding: '1.5rem',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>
                                Avis de la communauté
                                {ratingStats && (
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '10px', fontWeight: 400 }}>
                                        ({ratingStats.total_ratings || 0} avis — Moy. {ratingStats.average_rating || '?'}/5)
                                    </span>
                                )}
                            </h2>
                            {isAuthenticated && oeuvreId && !myRating && (
                                <button onClick={() => setShowForm(!showForm)} style={{
                                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                                    border: 'none', borderRadius: '8px', padding: '8px 16px',
                                    color: 'white', fontWeight: 700, cursor: 'pointer',
                                    fontFamily: 'Rajdhani, sans-serif', fontSize: '0.9rem',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                }}>
                                    <Plus size={16} /> Donner mon avis
                                </button>
                            )}
                        </div>

                        {!oeuvreId && isAuthenticated && (
                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Ajoute ce jeu à ta bibliothèque pour voir et laisser des avis.
                            </p>
                        )}

                        {/* Formulaire de critique */}
                        {showForm && (
                            <div style={{
                                background: 'var(--bg)', border: '1px solid var(--border)',
                                borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem',
                            }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                                    {myRating ? 'Modifier mon avis' : 'Mon avis'}
                                </h3>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '6px' }}>
                                        Note
                                    </label>
                                    <StarRating value={formNote} onChange={setFormNote} size={28} />
                                </div>
                                <textarea
                                    value={formContenu}
                                    onChange={e => setFormContenu(e.target.value)}
                                    placeholder="Qu'est-ce que tu en as pensé ? (optionnel)"
                                    rows={4}
                                    style={{
                                        width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
                                        borderRadius: '8px', padding: '10px', color: 'var(--text)',
                                        fontFamily: 'Exo 2, sans-serif', fontSize: '0.9rem', resize: 'vertical',
                                        outline: 'none',
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                    <button
                                        onClick={handleSubmitRating}
                                        disabled={submitting}
                                        style={{
                                            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                                            border: 'none', borderRadius: '8px', padding: '10px 24px',
                                            color: 'white', fontWeight: 700, cursor: 'pointer',
                                            fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem',
                                        }}
                                    >
                                        {submitting ? 'Envoi...' : 'Publier'}
                                    </button>
                                    <button
                                        onClick={() => setShowForm(false)}
                                        style={{
                                            background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
                                            padding: '10px 20px', color: 'var(--text-muted)', cursor: 'pointer',
                                            fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem',
                                        }}
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Liste des critiques */}
                        {ratings.length === 0 && oeuvreId && (
                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun avis pour le moment. Sois le premier !</p>
                        )}

                        {ratings.map(r => (
                            <div key={r.id} style={{
                                padding: '1rem 0', borderBottom: '1px solid var(--border)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                                            {r.pseudo || r.prenom || 'Utilisateur'}
                                        </span>
                                        <StarRating value={r.note} readOnly size={14} />
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {new Date(r.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {isAuthenticated && (
                                        <button
                                            onClick={() => handleLike(r.id)}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: r.liked ? 'var(--danger)' : 'var(--text-muted)',
                                                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem',
                                            }}
                                        >
                                            <Heart size={14} fill={r.liked ? 'var(--danger)' : 'none'} />
                                            {r.likes_count || 0}
                                        </button>
                                    )}
                                </div>
                                {r.contenu && (
                                    <p style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                        {r.contenu}
                                    </p>
                                )}
                                <CommentSection
                                    critiqueId={r.id}
                                    getAccessTokenSilently={getAccessTokenSilently}
                                    isAuthenticated={isAuthenticated}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── COLONNE DROITE ── */}
                <div>
                    {/* Ajouter à la bibliothèque */}
                    <div style={{
                        background: 'var(--bg-card)', borderRadius: '12px',
                        border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1rem',
                    }}>
                        <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>Ma Bibliothèque</h3>
                        {!isAuthenticated ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Connecte-toi pour ajouter ce jeu.</p>
                        ) : inLibrary ? (
                            <div style={{
                                background: 'var(--primary-glow)', border: '1px solid var(--primary)',
                                borderRadius: '8px', padding: '12px', textAlign: 'center',
                            }}>
                                <p style={{ color: 'var(--primary)', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem' }}>
                                    ✓ Dans ta collection
                                </p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                                    Statut : {STATUS_MAP[libraryStatut] || 'inconnu'}
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button onClick={() => handleAddToBiblio(3)} style={{
                                    background: '#92400e', color: '#fbbf24', border: 'none',
                                    borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer',
                                    fontFamily: 'Rajdhani, sans-serif', fontSize: '0.95rem',
                                }}>
                                    ✨ Envie de jouer
                                </button>
                                <button onClick={() => handleAddToBiblio(1)} style={{
                                    background: '#1e3a5f', color: '#60a5fa', border: 'none',
                                    borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer',
                                    fontFamily: 'Rajdhani, sans-serif', fontSize: '0.95rem',
                                }}>
                                    🎮 J'y joue
                                </button>
                                <button onClick={() => handleAddToBiblio(2)} style={{
                                    background: '#14532d', color: '#4ade80', border: 'none',
                                    borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer',
                                    fontFamily: 'Rajdhani, sans-serif', fontSize: '0.95rem',
                                }}>
                                    ✅ Terminé
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Infos techniques */}
                    <div style={{
                        background: 'var(--bg-card)', borderRadius: '12px',
                        border: '1px solid var(--border)', padding: '1.5rem',
                    }}>
                        <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>Infos</h3>
                        {[
                            ['Développeur', game.developers?.map(d => d.name).join(', ')],
                            ['Éditeur', game.publishers?.map(p => p.name).join(', ')],
                            ['Plateformes', game.platforms?.map(p => p.platform.name).join(', ')],
                            ['Durée moyenne', game.playtime ? `${game.playtime}h` : null],
                            ['Metacritic', game.metacritic],
                        ].filter(([, v]) => v).map(([label, value]) => (
                            <div key={label} style={{
                                display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                                borderBottom: '1px solid var(--border)', fontSize: '0.85rem',
                            }}>
                                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                <span style={{ color: 'var(--text)', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}