import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../hooks/useAuth';
import { createListeService } from '../services/listeService';
import { Plus, Trash2, Edit3, Eye, EyeOff, ChevronDown, ChevronUp, X, Globe, Lock } from 'lucide-react';

export default function ListesPage() {
    const { user } = useAuth();
    const { getAccessTokenSilently } = useAuth0();

    const [listes, setListes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Formulaire création
    const [showCreate, setShowCreate] = useState(false);
    const [newNom, setNewNom] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newVisi, setNewVisi] = useState('PRIVEE');
    const [creating, setCreating] = useState(false);

    // Édition
    const [editingId, setEditingId] = useState(null);
    const [editNom, setEditNom] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editVisi, setEditVisi] = useState('');

    // Oeuvres par liste (expandable)
    const [expandedId, setExpandedId] = useState(null);
    const [oeuvres, setOeuvres] = useState([]);
    const [oeuvresLoading, setOeuvresLoading] = useState(false);

    const loadListes = async () => {
        try {
            const service = createListeService(getAccessTokenSilently);
            const data = await service.getMyLists();
            const list = Array.isArray(data) ? data : data?.listes || [];
            setListes(list);
        } catch (err) { console.error('Erreur listes:', err); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadListes(); }, []);

    const handleCreate = async () => {
        if (!newNom.trim()) return;
        setCreating(true);
        try {
            const service = createListeService(getAccessTokenSilently);
            await service.create(newNom.trim(), newDesc.trim(), newVisi);
            setNewNom(''); setNewDesc(''); setNewVisi('PRIVEE'); setShowCreate(false);
            await loadListes();
        } catch (err) { alert('Erreur : ' + err.message); }
        finally { setCreating(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Supprimer cette liste ?')) return;
        try {
            const service = createListeService(getAccessTokenSilently);
            await service.delete(id);
            setListes(prev => prev.filter(l => l.id !== id));
            if (expandedId === id) setExpandedId(null);
        } catch (err) { alert('Erreur : ' + err.message); }
    };

    const handleEdit = (liste) => {
        setEditingId(liste.id);
        setEditNom(liste.nom);
        setEditDesc(liste.description || '');
        setEditVisi(liste.visibilite);
    };

    const handleSaveEdit = async () => {
        try {
            const service = createListeService(getAccessTokenSilently);
            await service.update(editingId, { nom: editNom, description: editDesc, visibilite: editVisi });
            setEditingId(null);
            await loadListes();
        } catch (err) { alert('Erreur : ' + err.message); }
    };

    const handleToggleOeuvres = async (id) => {
        if (expandedId === id) { setExpandedId(null); return; }
        setExpandedId(id);
        setOeuvresLoading(true);
        try {
            const service = createListeService(getAccessTokenSilently);
            const data = await service.getListOeuvres(id);
            setOeuvres(Array.isArray(data) ? data : data?.oeuvres || []);
        } catch { setOeuvres([]); }
        finally { setOeuvresLoading(false); }
    };

    const handleRemoveOeuvre = async (listeId, oeuvreId) => {
        try {
            const service = createListeService(getAccessTokenSilently);
            await service.removeOeuvre(listeId, oeuvreId);
            setOeuvres(prev => prev.filter(o => o.oeuvre_id !== oeuvreId && o.id !== oeuvreId));
        } catch (err) { alert('Erreur : ' + err.message); }
    };

    if (loading) return <div className="page-container">Chargement...</div>;

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>Mes Listes</h1>
                <button onClick={() => setShowCreate(!showCreate)} style={{
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    border: 'none', borderRadius: '8px', padding: '10px 20px',
                    color: 'white', fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Rajdhani, sans-serif', fontSize: '0.95rem',
                    display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                    <Plus size={18} /> Nouvelle liste
                </button>
            </div>

            {/* Formulaire de création */}
            {showCreate && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Créer une liste</h3>
                    <input value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Nom de la liste"
                        style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', color: 'var(--text)', fontFamily: 'Exo 2, sans-serif', marginBottom: '10px', outline: 'none' }} />
                    <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optionnel)" rows={2}
                        style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', color: 'var(--text)', fontFamily: 'Exo 2, sans-serif', marginBottom: '10px', outline: 'none', resize: 'vertical' }} />
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                        <button onClick={() => setNewVisi('PRIVEE')} style={{
                            flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
                            fontFamily: 'Rajdhani, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            background: newVisi === 'PRIVEE' ? 'var(--primary-glow)' : 'var(--bg)',
                            border: newVisi === 'PRIVEE' ? '1px solid var(--primary)' : '1px solid var(--border)',
                            color: newVisi === 'PRIVEE' ? 'var(--primary)' : 'var(--text-muted)',
                        }}>
                            <Lock size={14} /> Privée
                        </button>
                        <button onClick={() => setNewVisi('PUBLIQUE')} style={{
                            flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
                            fontFamily: 'Rajdhani, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            background: newVisi === 'PUBLIQUE' ? 'var(--primary-glow)' : 'var(--bg)',
                            border: newVisi === 'PUBLIQUE' ? '1px solid var(--primary)' : '1px solid var(--border)',
                            color: newVisi === 'PUBLIQUE' ? 'var(--primary)' : 'var(--text-muted)',
                        }}>
                            <Globe size={14} /> Publique
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleCreate} disabled={creating || !newNom.trim()} style={{
                            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                            border: 'none', borderRadius: '8px', padding: '10px 24px', color: 'white',
                            fontWeight: 700, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
                        }}>
                            {creating ? 'Création...' : 'Créer'}
                        </button>
                        <button onClick={() => setShowCreate(false)} style={{
                            background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
                            padding: '10px 20px', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
                        }}>
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {/* Liste des listes */}
            {listes.length === 0 ? (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Tu n'as encore aucune liste. Crée ta première liste thématique !</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {listes.map(liste => (
                        <div key={liste.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                            {/* Header de la liste */}
                            {editingId === liste.id ? (
                                <div style={{ padding: '1rem 1.5rem' }}>
                                    <input value={editNom} onChange={e => setEditNom(e.target.value)}
                                        style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px', color: 'var(--text)', fontFamily: 'Exo 2, sans-serif', marginBottom: '8px', outline: 'none' }} />
                                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2}
                                        style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px', color: 'var(--text)', fontFamily: 'Exo 2, sans-serif', marginBottom: '8px', outline: 'none', resize: 'vertical' }} />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select value={editVisi} onChange={e => setEditVisi(e.target.value)}
                                            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', color: 'var(--text)', fontFamily: 'Exo 2, sans-serif' }}>
                                            <option value="PRIVEE">Privée</option>
                                            <option value="PUBLIQUE">Publique</option>
                                        </select>
                                        <button onClick={handleSaveEdit} style={{ background: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '8px 16px', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif' }}>Sauvegarder</button>
                                        <button onClick={() => setEditingId(null)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif' }}>Annuler</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', gap: '12px' }}>
                                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleToggleOeuvres(liste.id)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h3 style={{ color: 'var(--text)', fontSize: '1.1rem' }}>{liste.nom}</h3>
                                            {liste.visibilite === 'PUBLIQUE' ? (
                                                <Globe size={14} style={{ color: 'var(--success)' }} title="Publique" />
                                            ) : (
                                                <Lock size={14} style={{ color: 'var(--text-muted)' }} title="Privée" />
                                            )}
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                ({liste.nombre_oeuvres || 0} jeux)
                                            </span>
                                        </div>
                                        {liste.description && (
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{liste.description}</p>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                        <button onClick={() => handleEdit(liste)} title="Modifier"
                                            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                            <Edit3 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(liste.id)} title="Supprimer"
                                            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: 'var(--danger)' }}>
                                            <Trash2 size={14} />
                                        </button>
                                        <button onClick={() => handleToggleOeuvres(liste.id)}
                                            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                            {expandedId === liste.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Oeuvres de la liste (expandable) */}
                            {expandedId === liste.id && (
                                <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem', background: 'var(--bg)' }}>
                                    {oeuvresLoading ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Chargement...</p>
                                    ) : oeuvres.length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                            Cette liste est vide. Ajoute des jeux depuis leur fiche.
                                        </p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {oeuvres.map(o => (
                                                <div key={o.oeuvre_id || o.id} style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '8px',
                                                    border: '1px solid var(--border)',
                                                }}>
                                                    <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem' }}>
                                                        {o.titre || o.oeuvre_titre || 'Jeu #' + (o.oeuvre_id || o.id)}
                                                    </span>
                                                    <button onClick={() => handleRemoveOeuvre(liste.id, o.oeuvre_id || o.id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}