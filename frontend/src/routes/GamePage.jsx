import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../hooks/useAuth';
import ReportButton from '../components/ReportButton';
import { createAdminService } from '../services/adminService';
import { rawgService } from '../services/rawgService';
import { createCritiqueService } from '../services/critiqueService';
import { createCommentaireService } from '../services/commentaireService';
import { createBibliothequeService } from '../services/bibliothequeService';
import { createListeService } from '../services/listeService';
import { Star, Heart, MessageCircle, Plus, Send, ChevronDown, ChevronUp, EyeOff, Award, Trash2, List } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const STATUS_LABELS = { 'envie': 'Envie', 'joue': 'Joué', 'termine': 'Terminé' };

function StarRating({ value, onChange, readOnly = false, size = 20 }) {
    const [hover, setHover] = useState(0);
    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={size}
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

function CommentSection({ critiqueId, getAccessTokenSilently, isAuthenticated }) {
    const [comments, setComments] = useState([]);
    const [open, setOpen] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const loadComments = async () => {
        try {
            const service = createCommentaireService(getAccessTokenSilently);
            const data = await service.getByRating(critiqueId);
            setComments(Array.isArray(data) ? data : data?.commentaires || []);
        } catch (err) { console.error('Erreur commentaires:', err); }
    };
    useEffect(() => { if (open) loadComments(); }, [open]);
    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        setLoading(true);
        try {
            const service = createCommentaireService(getAccessTokenSilently);
            await service.create(critiqueId, newComment.trim());
            setNewComment('');
            await loadComments();
        } catch (err) { alert('Erreur : ' + err.message); }
        finally { setLoading(false); }
    };
    return (
        <div style={{ marginTop: '8px' }}>
            <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Exo 2, sans-serif' }}>
                <MessageCircle size={14} /> Commentaires {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {open && (
                <div style={{ marginTop: '8px', paddingLeft: '12px', borderLeft: '2px solid var(--border)' }}>
                    {comments.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Aucun commentaire.</p>}
                    {comments.map(c => (
                        <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{c.pseudo || c.prenom || 'Utilisateur'}</span>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '0.75rem' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                            <p style={{ marginTop: '4px', color: 'var(--text)' }}>{c.contenu}</p>
                        </div>
                    ))}
                    {isAuthenticated && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Répondre..." onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text)', fontSize: '0.85rem', fontFamily: 'Exo 2, sans-serif', outline: 'none' }} />
                            <button onClick={handleSubmit} disabled={loading} style={{ background: 'var(--primary)', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
                                <Send size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function AddToListButton({ oeuvreId, getAccessTokenSilently, effectiveRawgId, rawgId, gameTitle, gameDescription }) {
    const [listes, setListes] = useState([]);
    const [listesWithGame, setListesWithGame] = useState(new Set());
    const [open, setOpen] = useState(false);
    const [adding, setAdding] = useState(null);
    const [loadingListes, setLoadingListes] = useState(false);

    useEffect(() => {
        if (!open) return;
        const load = async () => {
            setLoadingListes(true);
            try {
                const service = createListeService(getAccessTokenSilently);
                const data = await service.getMyLists();
                const allListes = Array.isArray(data) ? data : data?.listes || [];
                setListes(allListes);
                const inListes = new Set();
                await Promise.all(allListes.map(async (l) => {
                    try {
                        const oeuvresData = await service.getListOeuvres(l.id);
                        const oeuvres = Array.isArray(oeuvresData) ? oeuvresData : oeuvresData?.oeuvres || [];
                        if (oeuvres.some(o => String(o.oeuvre_id) === String(oeuvreId) || String(o.api_reference_id) === String(effectiveRawgId || rawgId)))
                            inListes.add(l.id);
                    } catch {}
                }));
                setListesWithGame(inListes);
            } catch {}
            finally { setLoadingListes(false); }
        };
        load();
    }, [open, oeuvreId]);

    const handleAdd = async (listeId) => {
        setAdding(listeId);
        try {
            const service = createListeService(getAccessTokenSilently);
            await service.addOeuvre(listeId, {
                api_reference_id: String(effectiveRawgId || rawgId || ''),
                titre: gameTitle || 'Jeu',
                description: gameDescription || 'Pas de description',
            });
            setListesWithGame(prev => new Set([...prev, listeId]));
        } catch (err) {
            if (err.message?.includes('Duplicate')) setListesWithGame(prev => new Set([...prev, listeId]));
            else alert('Erreur : ' + err.message);
        }
        finally { setAdding(null); }
    };

    return (
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <List size={18} /> Mes listes
                {listesWithGame.size > 0 && (
                    <span style={{ background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '10px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid var(--primary)' }}>
                        dans {listesWithGame.size} liste{listesWithGame.size > 1 ? 's' : ''}
                    </span>
                )}
            </h3>
            <button onClick={() => setOpen(!open)} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', color: 'var(--text)', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Plus size={16} /> {open ? 'Fermer' : 'Gérer les listes'}
            </button>
            {open && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {loadingListes ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '8px' }}>Chargement...</p>
                    : listes.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Aucune liste.</p>
                    : listes.map(l => {
                        const alreadyIn = listesWithGame.has(l.id);
                        return (
                            <button key={l.id} onClick={() => !alreadyIn && handleAdd(l.id)} disabled={alreadyIn || adding === l.id}
                                style={{ background: alreadyIn ? 'var(--primary-glow)' : 'var(--bg)', border: alreadyIn ? '1px solid var(--primary)' : '1px solid var(--border)', borderRadius: '8px', padding: '10px', textAlign: 'left', color: alreadyIn ? 'var(--primary)' : 'var(--text)', fontFamily: 'Exo 2, sans-serif', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: alreadyIn ? 'default' : 'pointer', opacity: alreadyIn ? 1 : (adding === l.id ? 0.6 : 1) }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{alreadyIn ? '✓' : adding === l.id ? '⏳' : '+'} {l.nom}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{alreadyIn ? 'Déjà ajouté' : l.visibilite === 'PUBLIQUE' ? '🌍' : '🔒'}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function getLibraryStatusLabel(statut) {
    if (statut === null || statut === undefined) return 'inconnu';
    if (typeof statut === 'object') return statut.libele || STATUS_LABELS[statut.code] || 'inconnu';
    return STATUS_LABELS[statut] || String(statut);
}

async function fetchRatings(oeuvreId) {
    try {
        const res = await fetch(`${API_URL}/critiques/${oeuvreId}/ratings`, { headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : Array.isArray(data?.critiques) ? data.critiques : [];
    } catch { return []; }
}

export default function GamePage() {
    const params = useParams();
    const location = useLocation();
    const rawgId = params.rawgId || null;
    const urlOeuvreId = params.oeuvreId || null;

    const { user, isAuthenticated } = useAuth();
    const { getAccessTokenSilently } = useAuth0();

    const [game, setGame] = useState(null);
    const [screenshots, setScreenshots] = useState([]);
    const [gameLoading, setGameLoading] = useState(true);
    const [critiquesLoaded, setCritiquesLoaded] = useState(false);

    const [oeuvreId, setOeuvreId] = useState(urlOeuvreId ? parseInt(urlOeuvreId) : null);
    const [inLibrary, setInLibrary] = useState(false);
    const [libraryStatut, setLibraryStatut] = useState(null);
    const [effectiveRawgId, setEffectiveRawgId] = useState(rawgId);

    const [ratings, setRatings] = useState([]);
    const [myRating, setMyRating] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [formNote, setFormNote] = useState(0);
    const [formContenu, setFormContenu] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // ══════════════════════════════════════
    // ÉTAPE 1 : Charger les critiques
    // ══════════════════════════════════════
    useEffect(() => {
        const loadCritiques = async () => {
            let oId = oeuvreId;
            if (!oId && rawgId && isAuthenticated) {
                try {
                    const bibService = createBibliothequeService(getAccessTokenSilently);
                    const items = await bibService.getItems();
                    const match = items.find(i => String(i.api_reference_id) === String(rawgId));
                    if (match) {
                        oId = match.oeuvre_id;
                        setOeuvreId(oId);
                        setInLibrary(true);
                        setLibraryStatut(match.statut);
                    }
                } catch {}
            }
            if (oId) {
                const list = await fetchRatings(oId);
                setRatings(list);
                if (!effectiveRawgId && list.length > 0) {
                    const ref = list.find(r => r.api_reference_id);
                    if (ref) setEffectiveRawgId(String(ref.api_reference_id));
                }
            }
            if (urlOeuvreId && isAuthenticated) {
                try {
                    const bibService = createBibliothequeService(getAccessTokenSilently);
                    const items = await bibService.getItems();
                    const match = items.find(i => String(i.oeuvre_id) === String(urlOeuvreId));
                    if (match) {
                        setInLibrary(true);
                        setLibraryStatut(match.statut);
                        if (match.api_reference_id && !effectiveRawgId) setEffectiveRawgId(String(match.api_reference_id));
                    }
                } catch {}
            }
            setCritiquesLoaded(true);
        };
        loadCritiques();
    }, [rawgId, urlOeuvreId, isAuthenticated]);

    // ══════════════════════════════════════
    // ÉTAPE 2 : Charger le jeu depuis RAWG
    // ══════════════════════════════════════
    useEffect(() => {
        const loadGame = async () => {
            setGameLoading(true);
            if (effectiveRawgId) {
                try {
                    const gameData = await rawgService.getGameDetails(effectiveRawgId);
                    const refTitle = ratings[0]?.oeuvre_titre || ratings[0]?.titre || '';
                    const isCorrect = !refTitle || gameData.name.toLowerCase().includes(refTitle.toLowerCase().substring(0, 5));
                    if (isCorrect) {
                        setGame(gameData);
                        const screens = await rawgService.getGameScreenshots(effectiveRawgId).catch(() => []);
                        setScreenshots(screens.slice(0, 4));
                        setGameLoading(false);
                        return;
                    }
                } catch {}
            }
            const title = ratings[0]?.oeuvre_titre || ratings[0]?.titre;
            if (title) {
                try {
                    const results = await rawgService.searchGames(title);
                    if (results.length > 0) {
                        const best = results[0];
                        setEffectiveRawgId(String(best.id));
                        const gameData = await rawgService.getGameDetails(best.id);
                        setGame(gameData);
                        const screens = await rawgService.getGameScreenshots(best.id).catch(() => []);
                        setScreenshots(screens.slice(0, 4));
                    }
                } catch {}
            }
            setGameLoading(false);
        };
        loadGame();
    }, [effectiveRawgId, ratings.length]);

    useEffect(() => {
        if (user && ratings.length > 0) setMyRating(ratings.find(r => r.user_id === user.id) || null);
    }, [user, ratings]);

    const handleAddToBiblio = async (statut) => {
        const id = effectiveRawgId;
        if (!id) return alert('Recherche le jeu depuis la barre de recherche pour l\'ajouter.');
        try {
            const bibService = createBibliothequeService(getAccessTokenSilently);
            await bibService.addItem({
                api_reference_id: String(id),
                titre: game?.name || ratings[0]?.oeuvre_titre || 'Jeu',
                description: game?.description_raw || 'Pas de description',
            }, statut);
            setInLibrary(true);
            setLibraryStatut(statut);
            const items = await bibService.getItems();
            const match = items.find(i => String(i.api_reference_id) === String(id));
            if (match) setOeuvreId(match.oeuvre_id);
        } catch (err) { alert('Erreur : ' + err.message); }
    };

    const handleSubmitRating = async () => {
        if (formNote === 0) return alert('Choisis une note');
        if (!oeuvreId) return alert('Ajoute d\'abord le jeu à ta bibliothèque');
        setSubmitting(true);
        try {
            const critiqueService = createCritiqueService(getAccessTokenSilently);
            const gameInfo = {
                titre: game?.name || ratings[0]?.oeuvre_titre || 'Jeu',
                description: game?.description_raw || 'Pas de description',
                api_reference_id: String(effectiveRawgId || ''),
            };
            if (myRating) await critiqueService.updateRating(oeuvreId, formNote, formContenu, gameInfo);
            else await critiqueService.createRating(oeuvreId, formNote, formContenu, gameInfo);
            const list = await fetchRatings(oeuvreId);
            setRatings(list);
            setShowForm(false);
            setFormNote(0);
            setFormContenu('');
        } catch (err) { alert('Erreur : ' + err.message); }
        finally { setSubmitting(false); }
    };

    const handleLike = async (ratingId) => {
        try {
            const cs = createCritiqueService(getAccessTokenSilently);
            await cs.likeRating(ratingId);
            setRatings(prev => prev.map(r => r.id === ratingId ? { ...r, likes_count: (r.likes_count || 0) + 1, liked: true } : r));
        } catch {
            try {
                const cs = createCritiqueService(getAccessTokenSilently);
                await cs.unlikeRating(ratingId);
                setRatings(prev => prev.map(r => r.id === ratingId ? { ...r, likes_count: Math.max(0, (r.likes_count || 1) - 1), liked: false } : r));
            } catch (e) { console.error(e); }
        }
    };

    // ══════════════════════════════════════
    // LOADING / NOT FOUND
    // ══════════════════════════════════════
    const hasContent = game || ratings.length > 0;
    const isStillLoading = (gameLoading || !critiquesLoaded) && !hasContent;

    if (isStillLoading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px', height: '40px', border: '3px solid var(--border)',
                        borderTop: '3px solid var(--primary)', borderRadius: '50%',
                        animation: 'spin 1s linear infinite', margin: '0 auto 1rem',
                    }} />
                    <p style={{ color: 'var(--text-muted)' }}>Chargement du jeu...</p>
                </div>
            </div>
        );
    }

    if (!hasContent && critiquesLoaded && !gameLoading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1rem' }}>Ce jeu n'a pas été trouvé.</p>
                    <button onClick={() => window.history.back()} style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
                        padding: '10px 24px', color: 'var(--text)', cursor: 'pointer',
                        fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                    }}>
                        ← Retour
                    </button>
                </div>
            </div>
        );
    }

    const gameTitle = game?.name || ratings[0]?.oeuvre_titre || ratings[0]?.titre || 'Jeu';

    // ══════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════
    return (
        <div className="page-container">
            {/* HERO */}
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '2rem', border: '1px solid var(--border)' }}>
                {game?.background_image ? (
                    <div style={{ height: '300px', backgroundImage: `url(${game.background_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                ) : (
                    <div style={{ height: '200px', background: 'linear-gradient(135deg, var(--bg-card), var(--primary-dark))' }} />
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(10,14,23,0.95))', padding: '3rem 2rem 1.5rem' }}>
                    <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', color: 'white' }}>{gameTitle}</h1>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {game?.released && <span style={{ color: '#ccc', fontSize: '0.9rem' }}>📅 {game.released}</span>}
                        {game?.rating > 0 && <span style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 700 }}>⭐ {game.rating}/5 RAWG</span>}
                        {game?.genres?.map(g => (
                            <span key={g.id} style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid var(--primary)' }}>{g.name}</span>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: game || isAuthenticated ? '1fr 320px' : '1fr', gap: '2rem', alignItems: 'start' }}>
                <div>
                    {game?.description_raw && (
                        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.3rem' }}>Description</h2>
                            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.9rem' }}>{game.description_raw}</p>
                        </div>
                    )}

                    {screenshots.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1.5rem' }}>
                            {screenshots.map((s, i) => <img key={i} src={s.image} alt="" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', height: '140px' }} />)}
                        </div>
                    )}

                    {/* AVIS */}
                    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>Avis ({ratings.length})</h2>
                            {isAuthenticated && oeuvreId && !myRating && (
                                <button onClick={() => setShowForm(!showForm)} style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', border: 'none', borderRadius: '8px', padding: '8px 16px', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Plus size={16} /> Donner mon avis
                                </button>
                            )}
                        </div>

                        {showForm && (
                            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>{myRating ? 'Modifier mon avis' : 'Mon avis'}</h3>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '6px' }}>Note</label>
                                    <StarRating value={formNote} onChange={setFormNote} size={28} />
                                </div>
                                <textarea value={formContenu} onChange={e => setFormContenu(e.target.value)} placeholder="Ton avis..." rows={4}
                                    style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', color: 'var(--text)', fontFamily: 'Exo 2, sans-serif', fontSize: '0.9rem', resize: 'vertical', outline: 'none' }} />
                                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                    <button onClick={handleSubmitRating} disabled={submitting} style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', border: 'none', borderRadius: '8px', padding: '10px 24px', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif' }}>
                                        {submitting ? 'Envoi...' : 'Publier'}
                                    </button>
                                    <button onClick={() => { setShowForm(false); setFormNote(0); setFormContenu(''); }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 20px', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif' }}>Annuler</button>
                                </div>
                            </div>
                        )}

                        {ratings.length === 0 && <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun avis pour le moment.</p>}

                        {ratings.map(r => {
                            const isMine = user && r.user_id === user.id;
                            return (
                                <div key={r.id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontWeight: 700, color: isMine ? 'var(--primary)' : 'var(--text)' }}>
                                                {r.pseudo || r.prenom || 'Utilisateur'}
                                                {isMine && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>(vous)</span>}
                                            </span>
                                            <StarRating value={r.note} readOnly size={14} />
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {isAuthenticated && (
                                                <button onClick={() => handleLike(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: r.liked ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                                                    <Heart size={14} fill={r.liked ? 'var(--danger)' : 'none'} /> {r.likes_count || 0}
                                                </button>
                                            )}
                                            {isMine && (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button title="Modifier" onClick={() => { setFormNote(r.note); setFormContenu(r.contenu || ''); setMyRating(r); setShowForm(true); }}
                                                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>Modifier</button>
                                                    <button title="Supprimer" onClick={async () => {
                                                        if (!confirm('Supprimer votre avis ?')) return;
                                                        try { const cs = createCritiqueService(getAccessTokenSilently); await cs.deleteRating(r.id); const list = await fetchRatings(oeuvreId); setRatings(list); setMyRating(null); } catch (err) { alert('Erreur : ' + err.message); }
                                                    }} style={{ background: 'none', border: '1px solid var(--danger)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>Supprimer</button>
                                                </div>
                                            )}
                                            {!isMine && <ReportButton critiqueId={r.id} contenu={r.contenu} />}
                                            {user?.role_id >= 2 && !isMine && (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {user.role_id === 3 && (
                                                        <button title="Coup de cœur" onClick={async () => { try { const s = createAdminService(getAccessTokenSilently); await s.feature(r.id); alert('Critique mise en avant !'); } catch (e) { alert(e.message); } }}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)' }}><Award size={14} /></button>
                                                    )}
                                                    <button title="Masquer" onClick={async () => { try { const s = createAdminService(getAccessTokenSilently); await s.hide(r.id); setRatings(prev => prev.filter(c => c.id !== r.id)); } catch (e) { alert(e.message); } }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warning)' }}><EyeOff size={14} /></button>
                                                    <button title="Supprimer" onClick={async () => { if (!confirm('Supprimer cette critique ?')) return; try { const s = createAdminService(getAccessTokenSilently); await s.deleteCritique(r.id); setRatings(prev => prev.filter(c => c.id !== r.id)); } catch (e) { alert(e.message); } }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {r.contenu && <p style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{r.contenu}</p>}
                                    <CommentSection critiqueId={r.id} getAccessTokenSilently={getAccessTokenSilently} isAuthenticated={isAuthenticated} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* COLONNE DROITE */}
                {(game || isAuthenticated) && (
                    <div>
                        {isAuthenticated && (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1rem' }}>
                                <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>Ma Bibliothèque</h3>
                                {inLibrary ? (
                                    <div style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                                        <p style={{ color: 'var(--primary)', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>✓ Dans ta collection</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>Statut : {getLibraryStatusLabel(libraryStatut)}</p>
                                    </div>
                                ) : effectiveRawgId ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <button onClick={() => handleAddToBiblio('envie')} style={{ background: '#92400e', color: '#fbbf24', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif' }}>✨ Envie de jouer</button>
                                        <button onClick={() => handleAddToBiblio('joue')} style={{ background: '#1e3a5f', color: '#60a5fa', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif' }}>🎮 J'y joue</button>
                                        <button onClick={() => handleAddToBiblio('termine')} style={{ background: '#14532d', color: '#4ade80', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif' }}>✅ Terminé</button>
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Recherche le jeu pour l'ajouter.</p>
                                )}
                            </div>
                        )}

                        {isAuthenticated && oeuvreId && (
                            <AddToListButton oeuvreId={oeuvreId} getAccessTokenSilently={getAccessTokenSilently}
                                effectiveRawgId={effectiveRawgId} rawgId={rawgId} gameTitle={gameTitle} gameDescription={game?.description_raw} />
                        )}

                        {game && (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem' }}>
                                <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>Infos</h3>
                                {[
                                    ['Développeur', game.developers?.map(d => d.name).join(', ')],
                                    ['Éditeur', game.publishers?.map(p => p.name).join(', ')],
                                    ['Plateformes', game.platforms?.map(p => p.platform.name).join(', ')],
                                    ['Durée moyenne', game.playtime ? `${game.playtime}h` : null],
                                    ['Metacritic', game.metacritic],
                                ].filter(([, v]) => v).map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                        <span style={{ color: 'var(--text)', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}