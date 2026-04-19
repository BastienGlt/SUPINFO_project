import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { createFeedService } from '../services/feedService';
import { Heart, MessageCircle } from 'lucide-react';

export default function HomePage() {
    const { isAuthenticated, getAccessTokenSilently } = useAuth0();
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        const service = createFeedService(getAccessTokenSilently);
        service.getFeed()
            .then((data) => setFeed(data.feed || []))
            .catch((err) => console.error('Erreur feed:', err))
            .finally(() => setLoading(false));
    }, [isAuthenticated]);

    if (loading) return <div className="page-container">Chargement...</div>;

    return (
        <div className="page-container">
            <div className="hero">
                <h1>Fil d'actualité</h1>
                <p>Les derniers avis de la communauté.</p>
            </div>
            <div className="grid">
                {feed.length === 0 ? (
                    <p>Aucune activité pour le moment.</p>
                ) : (
                    feed.map(post => (
                        <div key={`${post.type}-${post.id}`} className="card">
                            <div className="card-header">
                                <div>
                                    <h3 style={{color: 'white'}}>{post.titre || post.oeuvre_titre}</h3>
                                    <span style={{fontSize:'0.8rem', color:'#94a3b8'}}>par {post.pseudo || post.author_pseudo}</span>
                                </div>
                                {post.note && <span className="badge">{post.note}/20</span>}
                            </div>
                            <p style={{margin:'1rem 0', fontStyle:'italic'}}>"{post.contenu}"</p>
                            <div className="card-footer" style={{display:'flex', gap:'15px', borderTop:'1px solid #334155', paddingTop:'10px'}}>
                                <span className="icon-text"><Heart size={14}/> {post.likes_count || 0}</span>
                                <span className="icon-text"><MessageCircle size={14}/> {post.comments_count || 0}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}