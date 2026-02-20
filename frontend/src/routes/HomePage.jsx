import React from 'react';
import { DB } from '../services/mockDb';
import { Star, MessageCircle, Heart } from 'lucide-react';

export default function HomePage() {
    // Jointure : Critique -> User + Oeuvre
    const feed = DB.critiques.map(c => ({
        ...c,
        author: DB.users.find(u => u.id === c.user_id),
        oeuvre: DB.oeuvres.find(o => o.id === c.oeuvre_id),
        likes: DB.likes_critiques.filter(l => l.critique_id === c.id).length,
        comments: DB.commentaires.filter(com => com.critique_id === c.id).length
    }));

    return (
        <div className="page-container">
            <div className="hero">
                <h1>Fil d'actualité</h1>
                <p>Les derniers avis de la communauté.</p>
            </div>
            <div className="grid">
                {feed.map(post => (
                    <div key={post.id} className="card">
                        <div className="card-header">
                            <div>
                                <h3 style={{color: 'white'}}>{post.oeuvre.titre}</h3>
                                <span style={{fontSize:'0.8rem', color:'#94a3b8'}}>par {post.author.pseudo}</span>
                            </div>
                            <span className="badge">{post.note}/20</span>
                        </div>
                        <p style={{margin:'1rem 0', fontStyle:'italic'}}>"{post.contenu}"</p>
                        <div className="card-footer" style={{display:'flex', gap:'15px', borderTop:'1px solid #334155', paddingTop:'10px'}}>
                            <span className="icon-text"><Heart size={14}/> {post.likes}</span>
                            <span className="icon-text"><MessageCircle size={14}/> {post.comments}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}