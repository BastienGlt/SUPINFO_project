import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { rawgService } from '../services/rawgService';
import { Search, X, Loader, Gamepad2, Users, List, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdvancedSearch() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [tab, setTab] = useState('games'); // games | users | lists
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Résultats
    const [games, setGames] = useState([]);
    const [users, setUsers] = useState([]);
    const [lists, setLists] = useState([]);

    // Filtres jeux
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [selectedYear, setSelectedYear] = useState('');

    const timeoutRef = useRef(null);

    // Charger les genres RAWG au montage
    useEffect(() => {
        rawgService.getGenres()
            .then(setGenres)
            .catch(() => {});
    }, []);

    // Charger les listes publiques au montage
    const [allLists, setAllLists] = useState([]);

    useEffect(() => {
        // Listes publiques
        fetch(`${API_URL}/listes/public`, { headers: { 'Content-Type': 'application/json' } })
            .then(res => res.ok ? res.json() : [])
            .then(data => setAllLists(Array.isArray(data) ? data : data?.listes || []))
            .catch(() => {});
    }, []);

    // Recherche avec debounce
    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (query.length < 2) {
            setGames([]); setUsers([]); setLists([]);
            return;
        }

        setLoading(true);
        timeoutRef.current = setTimeout(async () => {
            try {
                const q = query.toLowerCase();

                if (tab === 'games') {
                    const results = await rawgService.searchGames(query, {
                        genre: selectedGenre,
                        year: selectedYear,
                    });
                    setGames(results);
                }

                if (tab === 'users') {
                    const res = await fetch(`${API_URL}/users?search=${encodeURIComponent(query)}`, { headers: { 'Content-Type': 'application/json' } });
                    const data = res.ok ? await res.json() : [];
                    setUsers(Array.isArray(data) ? data : []);
                }

                if (tab === 'lists') {
                    const filtered = allLists.filter(l =>
                        l.nom?.toLowerCase().includes(q) ||
                        l.description?.toLowerCase().includes(q) ||
                        l.createur_pseudo?.toLowerCase().includes(q)
                    );
                    setLists(filtered);
                }
            } catch (err) {
                console.error('Erreur recherche:', err);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(timeoutRef.current);
    }, [query, tab, selectedGenre, selectedYear]);

    const years = Array.from({ length: 30 }, (_, i) => 2026 - i);

    const tabStyle = (t) => ({
        padding: '10px 20px',
        background: tab === t ? 'var(--primary-glow)' : 'none',
        border: tab === t ? '1px solid var(--primary)' : '1px solid var(--border)',
        borderRadius: '8px',
        color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    });

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem' }}>

            {/* Onglets */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button style={tabStyle('games')} onClick={() => setTab('games')}>
                    <Gamepad2 size={16} /> Jeux
                </button>
                <button style={tabStyle('users')} onClick={() => setTab('users')}>
                    <Users size={16} /> Utilisateurs
                </button>
                <button style={tabStyle('lists')} onClick={() => setTab('lists')}>
                    <List size={16} /> Listes publiques
                </button>
            </div>

            {/* Barre de recherche */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg)',
                    border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px',
                }}>
                    <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginRight: '10px' }} />
                    <input
                        type="text"
                        placeholder={
                            tab === 'games' ? 'Rechercher un jeu...' :
                            tab === 'users' ? 'Rechercher un utilisateur...' :
                            'Rechercher une liste...'
                        }
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'Exo 2, sans-serif', fontSize: '0.9rem' }}
                    />
                    {loading && <Loader size={16} className="spinner" style={{ color: 'var(--text-muted)' }} />}
                    {query && !loading && (
                        <X size={16} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                           onClick={() => { setQuery(''); setGames([]); setUsers([]); setLists([]); }} />
                    )}
                </div>
                {tab === 'games' && (
                    <button onClick={() => setShowFilters(!showFilters)} style={{
                        background: showFilters ? 'var(--primary-glow)' : 'var(--bg)',
                        border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px',
                        color: showFilters ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                    }}>
                        <Filter size={16} /> Filtres {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                )}
            </div>

            {/* Filtres jeux */}
            {tab === 'games' && showFilters && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <select value={selectedGenre} onChange={e => setSelectedGenre(e.target.value)}
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text)', fontFamily: 'Exo 2, sans-serif', fontSize: '0.85rem' }}>
                        <option value="">Tous les genres</option>
                        {genres.map(g => <option key={g.id} value={g.slug}>{g.name}</option>)}
                    </select>
                    <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text)', fontFamily: 'Exo 2, sans-serif', fontSize: '0.85rem' }}>
                        <option value="">Toutes les années</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {(selectedGenre || selectedYear) && (
                        <button onClick={() => { setSelectedGenre(''); setSelectedYear(''); }}
                            style={{ background: 'none', border: '1px solid var(--danger)', borderRadius: '8px', padding: '8px 12px', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
                            Réinitialiser
                        </button>
                    )}
                </div>
            )}

            {/* RÉSULTATS : JEUX */}
            {tab === 'games' && games.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {games.map(game => (
                        <div key={game.id} onClick={() => navigate(`/game/${game.id}`)}
                            style={{
                                display: 'flex', gap: '12px', background: 'var(--bg)', border: '1px solid var(--border)',
                                borderRadius: '10px', padding: '12px', cursor: 'pointer', transition: 'border-color 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                            {game.background_image && (
                                <img src={game.background_image} alt="" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>{game.name}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {game.released || '?'} · ⭐ {game.rating}/5
                                </div>
                                {game.genres?.length > 0 && (
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                        {game.genres.slice(0, 3).map(g => (
                                            <span key={g.id} style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '1px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600 }}>
                                                {g.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* RÉSULTATS : UTILISATEURS */}
            {tab === 'users' && users.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {users.map(u => (
                        <div key={u.id} onClick={() => navigate(`/user/${u.id}`)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--bg)',
                                border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px',
                                cursor: 'pointer', transition: 'border-color 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                            {u.photo ? (
                                <img src={u.photo} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid var(--border-light)', objectFit: 'cover' }} />
                            ) : (
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-glow)',
                                    border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem',
                                }}>
                                    {(u.pseudo || '?')[0].toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: '0.95rem' }}>@{u.pseudo}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.prenom} {u.nom}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* RÉSULTATS : LISTES */}
            {tab === 'lists' && lists.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {lists.map(l => (
                        <div key={l.id}
                            style={{
                                background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px',
                                padding: '14px 18px', transition: 'border-color 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: '1rem' }}>{l.nom}</div>
                                    {l.description && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{l.description}</div>}
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ color: 'var(--primary)', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', fontSize: '1.1rem' }}>{l.nombre_oeuvres || 0}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>jeux</div>
                                </div>
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                par <span style={{ color: 'var(--primary)' }}>{l.createur_pseudo || 'Anonyme'}</span>
                                {l.created_at && <> · {new Date(l.created_at).toLocaleDateString()}</>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Messages vides */}
            {query.length >= 2 && !loading && (
                <>
                    {tab === 'games' && games.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Aucun jeu trouvé.</p>}
                    {tab === 'users' && users.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Aucun utilisateur trouvé.</p>}
                    {tab === 'lists' && lists.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Aucune liste trouvée.</p>}
                </>
            )}

            {/* Avant la recherche */}
            {query.length < 2 && tab === 'lists' && allLists.length > 0 && (
                <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '10px' }}>Listes publiques récentes :</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {allLists.slice(0, 5).map(l => (
                            <div key={l.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px' }}>
                                <div style={{ color: 'var(--text)', fontWeight: 700 }}>{l.nom}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                                    {l.nombre_oeuvres || 0} jeux · par {l.createur_pseudo || 'Anonyme'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}