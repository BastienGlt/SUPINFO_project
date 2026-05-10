import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuth0 } from '@auth0/auth0-react';
import { rawgService } from '../services/rawgService';
import { createBibliothequeService } from '../services/bibliothequeService';
import { Search, X, Loader, LogIn } from 'lucide-react';

export default function Header() {
    const { user, isAuthenticated } = useAuth();
    const { getAccessTokenSilently } = useAuth0();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [addingId, setAddingId] = useState(null);
    const timeoutRef = useRef(null);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (query.length < 2) { setResults([]); setIsOpen(false); return; }

        setLoading(true);
        timeoutRef.current = setTimeout(async () => {
            try {
                const data = await rawgService.searchGames(query);
                setResults(data);
                setIsOpen(true);
            } catch (err) {
                console.error('Erreur recherche:', err);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(timeoutRef.current);
    }, [query]);

    const handleAdd = async (game, statut) => {
        if (!isAuthenticated) return;
        setAddingId(game.id);
        try {
            const service = createBibliothequeService(getAccessTokenSilently);
            await service.addItem(String(game.id), statut);
            setQuery('');
            setIsOpen(false);
            setResults([]);
        } catch (err) {
            alert('Erreur : ' + err.message);
        } finally {
            setAddingId(null);
        }
    };

    return (
        <header className="header">
            <Link to="/" className="brand">
                <span className="brand-accent">PROJET</span>SUPINFO
            </Link>

            <div className="header-search" ref={wrapperRef}>
                <div className="header-search-inner">
                    <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input
                        type="text"
                        placeholder="Rechercher un jeu..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {loading && <Loader size={16} className="spinner" style={{ color: 'var(--text-muted)' }} />}
                    {query && !loading && (
                        <X size={16} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                           onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }} />
                    )}
                </div>

                {isOpen && results.length > 0 && (
                    <div className="search-dropdown">
                        {results.map(game => (
                            <div key={game.id} className="search-result-item">
                                {game.background_image && (
                                    <img src={game.background_image} alt="" className="search-result-img" />
                                )}
                                <div className="search-result-info">
                                    <div className="search-result-title">{game.name}</div>
                                    <div className="search-result-meta">
                                        {game.released || '?'} — ⭐ {game.rating}/5
                                    </div>
                                </div>
                                {isAuthenticated && (
                                    <div className="search-actions">
                                        {addingId === game.id ? (
                                            <Loader size={14} className="spinner" style={{ color: 'var(--text-muted)' }} />
                                        ) : (
                                            <>
                                                <button className="search-action-btn envie" onClick={() => handleAdd(game, 3)}>Envie</button>
                                                <button className="search-action-btn joue" onClick={() => handleAdd(game, 1)}>Joue</button>
                                                <button className="search-action-btn termine" onClick={() => handleAdd(game, 2)}>Fini</button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="header-user">
                {isAuthenticated && user ? (
                    <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        {user.photo && <img src={user.photo} alt="" className="header-avatar" />}
                        <div>
                            <div className="header-username">{user.pseudo}</div>
                            <div className="header-level">Membre</div>
                        </div>
                    </Link>
                ) : (
                    <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <LogIn size={18} /> Connexion
                    </Link>
                )}
            </div>
        </header>
    );
}