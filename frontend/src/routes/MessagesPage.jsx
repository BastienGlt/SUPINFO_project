import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { DB } from '../services/mockDb';
import { Send } from 'lucide-react';

export default function MessagesPage() {
    const { user } = useAuth();
    const [activeConvoId, setActiveConvoId] = useState(null);

    // 1. Trouver les conversations où je suis participant
    const myConvos = DB.conversation_participants
        .filter(cp => cp.user_id === user.id)
        .map(cp => {
            const convo = DB.conversations.find(c => c.id === cp.conversation_id);
            // Trouver l'AUTRE participant
            const otherParticipantRef = DB.conversation_participants.find(
                part => part.conversation_id === convo.id && part.user_id !== user.id
            );
            const otherUser = DB.users.find(u => u.id === otherParticipantRef?.user_id);
            
            // Dernier message
            const lastMsg = DB.messages
                .filter(m => m.conversation_id === convo.id)
                .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];

            return { ...convo, otherUser, lastMsg };
        });

    // 2. Charger les messages de la conversation active
    const activeMessages = activeConvoId 
        ? DB.messages.filter(m => m.conversation_id === activeConvoId).sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
        : [];

    return (
        <div className="page-container full-height">
            <div className="msg-layout">
                <div className="msg-sidebar">
                    <div className="msg-header">Discussions</div>
                    {myConvos.map(c => (
                        <div 
                            key={c.id} 
                            className={`msg-item ${activeConvoId === c.id ? 'active' : ''}`}
                            onClick={() => setActiveConvoId(c.id)}
                        >
                            <div style={{fontWeight:'bold'}}>{c.otherUser?.pseudo || 'Utilisateur inconnu'}</div>
                            <div className="msg-preview">{c.lastMsg?.contenu || 'Aucun message'}</div>
                        </div>
                    ))}
                </div>
                <div className="msg-content">
                    {activeConvoId ? (
                        <>
                            <div className="chat-area">
                                {activeMessages.map(m => (
                                    <div key={m.id} className={`chat-bubble ${m.user_id === user.id ? 'me' : 'other'}`}>
                                        {m.contenu}
                                    </div>
                                ))}
                            </div>
                            <div className="chat-input-area">
                                <input type="text" placeholder="Écrire..." className="chat-input" />
                                <button className="btn-icon"><Send size={18}/></button>
                            </div>
                        </>
                    ) : (
                        <div className="empty-chat">Sélectionnez une conversation</div>
                    )}
                </div>
            </div>
        </div>
    );
}