import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { DB } from '../services/mockDb';

export default function BibliothequePage() {
    const { user } = useAuth();
    
    // Jointure : Biblio -> Oeuvre
    const myItems = DB.bibliotheque_items
        .filter(item => item.user_id === user.id)
        .map(item => ({
            ...item,
            oeuvre: DB.oeuvres.find(o => o.id === item.oeuvre_id)
        }));

    const statusColors = {
        'termine': 'text-green-400 border-green-900 bg-green-900/20',
        'en_cours': 'text-blue-400 border-blue-900 bg-blue-900/20',
        'envie': 'text-yellow-400 border-yellow-900 bg-yellow-900/20'
    };

    return (
        <div className="page-container">
            <h1 style={{marginBottom:'2rem', color:'var(--primary)'}}>Ma Collection</h1>
            {myItems.length === 0 ? <p>Votre bibliothèque est vide.</p> : (
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
                            {myItems.map(item => (
                                <tr key={item.id}>
                                    <td style={{fontWeight:'bold'}}>{item.oeuvre.titre}</td>
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