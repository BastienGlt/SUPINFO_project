import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../hooks/useAuth';
import { createBibliothequeService } from '../services/bibliothequeService';
import SearchBar from '../components/SearchBar';
import { Trash2 } from 'lucide-react';

const STATUS_MAP = {
    3: 'envie',
    1: 'joue',
    2: 'terminé',
};

const STATUS_STYLES = {
    3: { color: '#facc15', background: '#713f1220', border: '1px solid #713f12', padding: '4px 12px', borderRadius: '12px' },
    1: { color: '#60a5fa', background: '#1e3a5f20', border: '1px solid #1e3a5f', padding: '4px 12px', borderRadius: '12px' },
    2: { color: '#4ade80', background: '#14532d20', border: '1px solid #14532d', padding: '4px 12px', borderRadius: '12px' },
};

export default function BibliothequePage() {
    const { user } = useAuth();
    const { getAccessTokenSilently } = useAuth0();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadItems = async () => {
        try {
            const service = createBibliothequeService(getAccessTokenSilently);
            const data = await service.getItems();
            setItems(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, []);

    const handleAddGame = async (gameData, statut) => {
        const service = createBibliothequeService(getAccessTokenSilently);
        await service.addItem(gameData.api_reference_id, statut);
        await loadItems(); // recharge la liste
    };

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

            <SearchBar onAddGame={handleAddGame} />

            {items.length === 0 ? <p>Votre bibliothèque est vide. Recherchez un jeu ci-dessus pour commencer.</p> : (
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
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: 'bold' }}>{item.titre}</td>
                                    <td>
                                        <span style={STATUS_STYLES[item.statut] || {}}>
                                            {STATUS_MAP[item.statut] || 'inconnu'}
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
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}