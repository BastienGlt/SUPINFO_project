import React, { useState, useEffect, useRef } from 'react';
import { rawgService } from '../services/rawgService';
import { Search, X, Plus, Loader } from 'lucide-react';

export default function SearchBar({ onAddGame }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [addingId, setAddingId] = useState(null);
    const timeoutRef = useRef(null);
    const wrapperRef = useRef(null);


    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

 
    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (query.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

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
        setAddingId(game.id);
        try {
            await onAddGame({
                api_reference_id: String(game.id),
                titre: game.name,
                description: game.description_raw || '',
                image: game.background_image || '',
            }, statut);
            setQuery('');
            setIsOpen(false);
            setResults([]);
        } catch (err) {
            console.error('Erreur ajout:', err);
            alert('Erreur lors de l\'ajout : ' + err.message);
        } finally {
            setAddingId(null);
        }
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', marginBottom: '2rem' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#1e293b',
                borderRadius: '12px',
                padding: '10px 16px',
                border: '1px solid #334155',
            }}>
                <Search size={18} style={{ color: '#64748b', marginRight: '10px' }} />
                <input
                    type="text"
                    placeholder="Rechercher un jeu..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        outline: 'none',
                        color: 'white',
                        fontSize: '1rem',
                    }}
                />
                {loading && <Loader size={18} style={{ color: '#64748b', animation: 'spin 1s linear infinite' }} />}
                {query && !loading && (
                    <X size={18} style={{ color: '#64748b', cursor: 'pointer' }}
                       onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }} />
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    marginTop: '8px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 50,
                }}>
                    {results.map(game => (
                        <div key={game.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 16px',
                            borderBottom: '1px solid #334155',
                            gap: '12px',
                        }}>
                            {game.background_image && (
                                <img
                                    src={game.background_image}
                                    alt={game.name}
                                    style={{
                                        width: '60px',
                                        height: '40px',
                                        objectFit: 'cover',
                                        borderRadius: '6px',
                                    }}
                                />
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.95rem' }}>
                                    {game.name}
                                </div>
                                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                    {game.released || 'Date inconnue'} — {game.rating}/5
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {addingId === game.id ? (
                                    <Loader size={16} style={{ color: '#64748b', animation: 'spin 1s linear infinite' }} />
                                ) : (
                                    <>
                                        <button onClick={() => handleAdd(game, 3)} title="Envie"
                                            style={{ background: '#713f12', color: '#facc15', border: 'none', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                            Envie
                                        </button>
                                        <button onClick={() => handleAdd(game, 1)} title="En cours"
                                            style={{ background: '#1e3a5f', color: '#60a5fa', border: 'none', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                            Joue
                                        </button>
                                        <button onClick={() => handleAdd(game, 2)} title="Terminé"
                                            style={{ background: '#14532d', color: '#4ade80', border: 'none', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                            Terminé
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}