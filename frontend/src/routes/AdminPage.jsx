import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { createAdminService } from '../services/adminService';
import { Shield, Star, EyeOff, UserX, AlertTriangle, Trash2, Eye, Award, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';

function Section({ title, icon: Icon, children, count, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '1rem', overflow: 'hidden' }}>
            <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={20} style={{ color: 'var(--primary)' }} />
                    <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.1rem' }}>{title}</h3>
                    {count > 0 && <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>{count}</span>}
                </div>
                {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {open && <div style={{ padding: '0 1.5rem 1.5rem' }}>{children}</div>}
        </div>
    );
}

export default function AdminPage() {
    const { user } = useAuth();
    const { getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();

    const [featured, setFeatured] = useState([]);
    const [hidden, setHidden] = useState([]);
    const [banned, setBanned] = useState([]);
    const [warned, setWarned] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState('');

    useEffect(() => {
        if (user && user.role_id < 2) navigate('/profile', { replace: true });
    }, [user]);

    const isAdmin = user?.role_id === 3;

    useEffect(() => {
        if (!user || user.role_id < 2) return;
        const load = async () => {
            const service = createAdminService(getAccessTokenSilently);
            try {
                const [f, h, b, w, r] = await Promise.all([
                    isAdmin ? service.getFeatured().catch(() => []) : Promise.resolve([]),
                    service.getHidden().catch(() => []),
                    isAdmin ? service.getBanned().catch(() => []) : Promise.resolve([]),
                    service.getWarned().catch(() => []),
                    service.getSignalements('en_attente').catch(() => []),
                ]);
                setFeatured(Array.isArray(f) ? f : []);
                setHidden(Array.isArray(h) ? h : []);
                setBanned(Array.isArray(b) ? b : []);
                setWarned(Array.isArray(w) ? w : []);
                setReports(Array.isArray(r) ? r : []);
            } catch {}
            setLoading(false);
        };
        load();
    }, [user]);

    const showMsg = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };

    const action = async (fn, successMsg) => {
        try { const s = createAdminService(getAccessTokenSilently); await fn(s); showMsg(successMsg); }
        catch (err) { alert('Erreur : ' + err.message); }
    };

    if (!user || user.role_id < 2) return null;
    if (loading) return <div className="page-container">Chargement...</div>;

    return (
        <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                <Shield size={28} style={{ color: 'var(--primary)' }} /><h1 style={{ fontSize: '1.8rem' }}>Panneau d'administration</h1>
            </div>
            {actionMsg && <div style={{ background: '#14532d', border: '1px solid #22c55e', borderRadius: '8px', padding: '12px 16px', marginBottom: '1rem', color: '#4ade80', fontWeight: 600 }}>✓ {actionMsg}</div>}

            <Section title="Signalements" icon={AlertTriangle} count={reports.length} defaultOpen={reports.length > 0}>
                {reports.length === 0 ? <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun signalement en attente.</p>
                : reports.map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <div>
                            <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem' }}>{r.type_contenu} #{r.contenu_id}</div>
                            <div style={{ color: 'var(--warning)', fontSize: '0.8rem' }}>Motif : {r.motif}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Par {r.signaleur_pseudo} · {new Date(r.created_at).toLocaleDateString()}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            {r.type_contenu === 'critique' && (
                                <button onClick={() => action(s => s.hide(r.contenu_id), 'Critique masquée').then(() => action(s => s.updateSignalementStatut(r.id, 'modere'), '').then(() => setReports(prev => prev.filter(x => x.id !== r.id))))}
                                    style={{ background: '#92400e', color: '#fbbf24', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <EyeOff size={12} /> Masquer
                                </button>
                            )}
                            <button onClick={() => action(s => s.updateSignalementStatut(r.id, 'rejete'), 'Signalement rejeté').then(() => setReports(prev => prev.filter(x => x.id !== r.id)))}
                                style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                                Ignorer
                            </button>
                        </div>
                    </div>
                ))}
            </Section>

            <Section title="Critiques masquées" icon={EyeOff} count={hidden.length}>
                {hidden.length === 0 ? <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune.</p>
                : hidden.map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <div><div style={{ color: 'var(--text)', fontWeight: 600 }}>{c.oeuvre_titre || 'Critique #' + c.id}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>par {c.pseudo || 'Utilisateur'}</div></div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => action(s => s.unhide(c.id), 'Visible').then(() => setHidden(prev => prev.filter(x => x.id !== c.id)))} style={{ background: '#14532d', color: '#4ade80', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}><Eye size={12} /> Visible</button>
                            <button onClick={() => { if (confirm('Supprimer ?')) action(s => s.deleteCritique(c.id), 'Supprimée').then(() => setHidden(prev => prev.filter(x => x.id !== c.id))); }} style={{ background: '#7f1d1d', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}><Trash2 size={12} /> Supprimer</button>
                        </div>
                    </div>
                ))}
            </Section>

            {isAdmin && (
                <Section title="Coups de cœur" icon={Award} count={featured.length}>
                    {featured.length === 0 ? <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune.</p>
                    : featured.map(c => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                            <div><div style={{ color: 'var(--text)', fontWeight: 600 }}>{c.oeuvre_titre || 'Critique #' + c.id}</div></div>
                            <button onClick={() => action(s => s.unfeature(c.id), 'Retiré').then(() => setFeatured(prev => prev.filter(x => x.id !== c.id)))} style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Retirer</button>
                        </div>
                    ))}
                </Section>
            )}

            {isAdmin && (
                <Section title="Utilisateurs bannis" icon={UserX} count={banned.length}>
                    {banned.length === 0 ? <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun.</p>
                    : banned.map(u => (
                        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ color: 'var(--text)', fontWeight: 600 }}>@{u.pseudo}</div>
                            <button onClick={() => action(s => s.unban(u.id), 'Débanni').then(() => setBanned(prev => prev.filter(x => x.id !== u.id)))} style={{ background: '#14532d', color: '#4ade80', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><UserCheck size={14} /> Débannir</button>
                        </div>
                    ))}
                </Section>
            )}

            <Section title="Utilisateurs avertis" icon={AlertTriangle} count={warned.length}>
                {warned.length === 0 ? <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun.</p>
                : warned.map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ color: 'var(--text)', fontWeight: 600 }}>@{u.pseudo}</div>
                        <button onClick={() => action(s => s.unwarn(u.id), 'Avertissement retiré').then(() => setWarned(prev => prev.filter(x => x.id !== u.id)))} style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>Retirer</button>
                    </div>
                ))}
            </Section>
        </div>
    );
}