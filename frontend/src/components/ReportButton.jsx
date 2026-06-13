import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Flag, X } from 'lucide-react';

const REASONS = [
    'Spoiler non marqué',
    'Insulte / Contenu haineux',
    'Contenu inapproprié',
    'Spam',
    'Autre',
];

export default function ReportButton({ critiqueId, contenu }) {
    const { user, isAuthenticated } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    const [sent, setSent] = useState(false);

    if (!isAuthenticated || !user) return null;

    const handleSubmit = () => {
        if (!selectedReason) return;
        const reports = JSON.parse(localStorage.getItem('gestent_reports') || '[]');
        reports.push({
            critiqueId,
            contenu: contenu?.substring(0, 100),
            reason: selectedReason,
            reporterId: user.id,
            reporterPseudo: user.pseudo,
            date: new Date().toISOString(),
        });
        localStorage.setItem('gestent_reports', JSON.stringify(reports));
        setSent(true);
        setTimeout(() => { setShowModal(false); setSent(false); setSelectedReason(''); }, 1500);
    };

    return (
        <>
            <button onClick={() => setShowModal(true)} title="Signaler"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                <Flag size={12} /> Signaler
            </button>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
                }} onClick={() => setShowModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px',
                        padding: '2rem', width: '400px', maxWidth: '90vw',
                    }}>
                        {sent ? (
                            <div style={{ textAlign: 'center', color: 'var(--success)' }}>
                                <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>✓ Signalement envoyé</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>Un modérateur examinera le contenu.</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ color: 'var(--primary)', fontFamily: 'Rajdhani, sans-serif', fontSize: '1.2rem' }}>
                                        <Flag size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                        Signaler un contenu
                                    </h3>
                                    <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                        <X size={18} />
                                    </button>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Quel est le motif du signalement ?</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                                    {REASONS.map(reason => (
                                        <button key={reason} onClick={() => setSelectedReason(reason)} style={{
                                            padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                                            background: selectedReason === reason ? 'var(--primary-glow)' : 'var(--bg)',
                                            border: selectedReason === reason ? '1px solid var(--primary)' : '1px solid var(--border)',
                                            color: selectedReason === reason ? 'var(--primary)' : 'var(--text)',
                                            fontWeight: selectedReason === reason ? 700 : 400,
                                            textAlign: 'left', fontFamily: 'Exo 2, sans-serif', fontSize: '0.9rem',
                                        }}>
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={handleSubmit} disabled={!selectedReason} style={{
                                    width: '100%', padding: '10px',
                                    background: selectedReason ? 'linear-gradient(135deg, var(--danger), #991b1b)' : 'var(--bg)',
                                    color: selectedReason ? 'white' : 'var(--text-muted)',
                                    border: 'none', borderRadius: '8px', fontWeight: 700, cursor: selectedReason ? 'pointer' : 'not-allowed',
                                    fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem',
                                }}>
                                    Envoyer le signalement
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}