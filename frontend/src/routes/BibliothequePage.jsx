import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createBibliothequeService } from '../services/bibliothequeService';
import { Trash2, ExternalLink } from 'lucide-react';

const STATUS_MAP = {
    1: 'joue',
    2: 'terminé',
    3: 'envie',
    'joue': 'joue',
    'termine': 'terminé',
    'envie': 'envie',
    'en_cours': 'joue',
    'A_VOIR': 'envie',
};

const STATUS_STYLES = {
    'joue':    { color: '#60a5fa', background: '#1e3a5f20', border: '1px solid #1e3a5f', padding: '4px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' },
    'terminé': { color: '#4ade80', background: '#14532d20', border: '1px solid #14532d', padding: '4px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' },
    'envie':   { color: '#facc15', background: '#713f1220', border: '1px solid #713f12', padding: '4px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' },
};

function getStatusLabel(statut) {
    return STATUS_MAP[statut] || STATUS_MAP[String(statut)] || 'inconnu';
}

export default function BibliothequePage() {
    const { user } = useAuth();
    const { getAccessTokenSilently } = useAuth0();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const service = createBibliothequeService(getAccessTokenSilently);
        service.getItems()
            .then((data) => {
                console.log('Bibliotheque items:', data); // debug pour voir la structure
                setItems(data);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (itemId) => {
        if (!confirm('Supprimer ce jeu de ta collection ?')) return;
        try {
            const service = createBibliothequeService(getAccessTokenSilently);
            await service.deleteItem(itemId);
            setItems(items.filter(i => i.id !== itemId));
        } catch (err) {
            alert('Erreur : ' + err.message);
        }
    };

    if (loading) return <div className="page-container">Chargement...</div>;
    if (error) return <div className="page-container">Erreur : {error}</div>;

    return (
        <div className="page-container">
            <h1 style={{ marginBottom: '2rem', color: 'var(--primary)' }}>Ma Collection</h1>
            {items.length === 0 ? <p>Votre bibliothèque est vide. Recherchez un jeu pour commencer.</p> : (
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
                            {items.map(item => {
                                const label = getStatusLabel(item.statut);
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <Link
                                                to={`/game/${item.api_reference_id}`}
                                                style={{
                                                    color: 'var(--text)',
                                                    textDecoration: 'none',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                }}
                                            >
                                                {item.titre}
                                                <ExternalLink size={14} style={{ color: 'var(--primary)' }} />
                                            </Link>
                                        </td>
                                        <td>
                                            <span style={STATUS_STYLES[label] || {}}>
                                                {label}
                                            </span>
                                        </td>
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