import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function MessagesPage() {
    return (
        <div className="page-container">
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
                <MessageCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Messagerie</h2>
                <p style={{ color: 'var(--text-muted)' }}>La messagerie sera bientôt disponible.</p>
            </div>
        </div>
    );
}