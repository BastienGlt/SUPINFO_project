import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createBibliothequeService } from '../services/bibliothequeService';
import { Trash2, ExternalLink } from 'lucide-react';

const STATUS_STYLES = {
    'Joué':    { color: '#2563eb', background: 'rgba(37,99,235,0.15)', border: '1.5px solid #2563eb', padding: '4px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' },
    'Terminé': { color: '#16a34a', background: 'rgba(22,163,74,0.15)', border: '1.5px solid #16a34a', padding: '4px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' },
    'Envie':   { color: '#b45309', background: 'rgba(180,83,9,0.15)', border: '1.5px solid #b45309', padding: '4px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' },
};

const CODE_TO_LABEL = {
    'joue': 'Joué',
    'termine': 'Terminé',
    'envie': 'Envie',
};

function getStatusLabel(statut) {
    if (statut === null || statut === undefined) return 'Envie';
    if (typeof statut === 'object') return statut.libele || CODE_TO_LABEL[statut.code] || 'Envie';
    return CODE_TO_LABEL[String(statut)] || String(statut);
}

function getFilterKey(statut) {
    if (statut === null || statut === undefined) return 'Envie';
    if (typeof statut === 'object') return CODE_TO_LABEL[statut.code] || statut.libele || 'Envie';
    return CODE_TO_LABEL[String(statut)] || String(statut);
}

export default function BibliothequePage() {
    const { user } = useAuth();
    const { getAccessTokenSilently } = useAuth0();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('tous');

    useEffect(() => {
        const service = createBibliothequeService(getAccessTokenSilently);
        service.getItems()
            .then(setItems)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (itemId) => {
        if (!confirm('Supprimer ce jeu de ta collection ?')) return;
        try {
            const service = createBibliothequeService(getAccessTokenSilently);
            await service.deleteItem(itemId);
            setItems(items.filter(i => i.id !== itemId));
        } catch (err) { alert('Erreur : ' + err.message); }
    };

    const count = (label) => items.filter(i => getFilterKey(i.statut) === label).length;
    const filteredItems = filter === 'tous' ? items : items.filter(i => getFilterKey(i.statut) === filter);

    const btnStyle = (f) => ({
        padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
        fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.85rem',
        border: filter === f ? '1px solid var(--primary)' : '1px solid var(--border)',
        background: filter === f ? 'var(--primary-glow)' : 'var(--bg)',
        color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
    });

    if (loading) return <div className="page-container">Chargement...</div>;
    if (error) return <div className="page-container">Erreur : {error}</div>;

    return (
        <div className="page-container">
            <h1 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Ma Collection ({items.length})</h1>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button style={btnStyle('tous')} onClick={() => setFilter('tous')}>Tous ({items.length})</button>
                <button style={btnStyle('Joué')} onClick={() => setFilter('Joué')}>🎮 Joué ({count('Joué')})</button>
                <button style={btnStyle('Terminé')} onClick={() => setFilter('Terminé')}>✅ Terminé ({count('Terminé')})</button>
                <button style={btnStyle('Envie')} onClick={() => setFilter('Envie')}>✨ Envie ({count('Envie')})</button>
            </div>

            {filteredItems.length === 0 ? (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {filter === 'tous' ? 'Votre bibliothèque est vide. Recherchez un jeu pour commencer.' : 'Aucun jeu dans cette catégorie.'}
                    </p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Jeu</th>
                                <th>Statut</th>
                                <th>Dernière MAJ</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => {
                                const label = getStatusLabel(item.statut);
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <Link to={`/game/${item.api_reference_id}`}
                                                style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {item.titre}
                                                <ExternalLink size={14} style={{ color: 'var(--primary)' }} />
                                            </Link>
                                        </td>
                                        <td><span style={STATUS_STYLES[label] || STATUS_STYLES['Envie']}>{label}</span></td>
                                        <td>{new Date(item.updated_at).toLocaleDateString()}</td>
                                        <td>
                                            <button onClick={() => handleDelete(item.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}