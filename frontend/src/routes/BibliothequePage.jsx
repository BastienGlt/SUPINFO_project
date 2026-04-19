import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../hooks/useAuth';
import { createBibliothequeService } from '../services/bibliothequeService';

export default function BibliothequePage() {
    const { user } = useAuth();
    const { getAccessTokenSilently } = useAuth0();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const service = createBibliothequeService(getAccessTokenSilently);
        service.getItems()
            .then(setItems)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const statusColors = {
        'termine': 'text-green-400 border-green-900 bg-green-900/20',
        'en_cours': 'text-blue-400 border-blue-900 bg-blue-900/20',
        'envie': 'text-yellow-400 border-yellow-900 bg-yellow-900/20'
    };

    if (loading) return <div className="page-container">Chargement...</div>;
    if (error) return <div className="page-container">Erreur : {error}</div>;

    return (
        <div className="page-container">
            <h1 style={{marginBottom:'2rem', color:'var(--primary)'}}>Ma Collection</h1>
            {items.length === 0 ? <p>Votre bibliothèque est vide.</p> : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Jeu</th>
                                <th>Statut</th>
                                <th>Dernière MAJ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td style={{fontWeight:'bold'}}>{item.titre}</td>
                                    <td>
                                        <span className={`status-pill ${statusColors[item.statut] || ''}`}>
                                            {item.statut.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>{new Date(item.updated_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}