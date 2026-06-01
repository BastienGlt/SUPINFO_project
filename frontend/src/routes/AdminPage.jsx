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
            <button onClick={() => setOpen(!open)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)',
            }}>
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

    // Vérifier les permissions
    useEffect(() => {
        if (user && user.role_id < 2) navigate('/profile', { replace: true });
    }, [user]);

    const isAdmin = user?.role_id === 3;

    useEffect(() => {
        if (!user || user.role_id < 2) return;
        const load = async () => {
            const service = createAdminService(getAccessTokenSilently);
            try {
                const [f, h, b, w] = await Promise.all([
                    isAdmin ? service.getFeatured().catch(() => []) : Promise.resolve([]),
                    service.getHidden().catch(() => []),
                    isAdmin ? service.getBanned().catch(() => []) : Promise.resolve([]),
                    service.getWarned().catch(() => []),
                ]);
                setFeatured(Array.isArray(f) ? f : []);
                setHidden(Array.isArray(h) ? h : []);
                setBanned(Array.isArray(b) ? b : []);
                setWarned(Array.isArray(w) ? w : []);
            } catch (err) { console.error(err); }

            // Charger les signalements locaux
            try {
                const r = JSON.parse(localStorage.getItem('gestent_reports') || '[]');
                setReports(r);
            } catch {}

            setLoading(false);
        };
        load();
    }, [user]);

    const showMsg = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };

    const action = async (fn, successMsg) => {
        try {
            const service = createAdminService(getAccessTokenSilently);
            await fn(service);
            showMsg(successMsg);
        } catch (err) { alert('Erreur : ' + err.message); }
    };

    const handleUnfeature = async (id) => {
        await action(s => s.unfeature(id), 'Critique retirée des coups de cœur');
        setFeatured(prev => prev.filter(c => c.id !== id));
    };

    const handleUnhide = async (id) => {
        await action(s => s.unhide(id), 'Critique rendue visible');
        setHidden(prev => prev.filter(c => c.id !== id));
    };

    const handleDeleteCritique = async (id, from) => {
        if (!confirm('Supprimer cette critique définitivement ?')) return;
        await action(s => s.deleteCritique(id), 'Critique supprimée');
        if (from === 'hidden') setHidden(prev => prev.filter(c => c.id !== id));
        if (from === 'report') {
            const updated = reports.filter(r => r.critiqueId !== id);
            setReports(updated);
            localStorage.setItem('gestent_reports', JSON.stringify(updated));
        }
    };

    const handleUnban = async (id) => {
        await action(s => s.unban(id), 'Utilisateur débanni');
        setBanned(prev => prev.filter(u => u.id !== id));
    };

    const handleUnwarn = async (id) => {
        await action(s => s.unwarn(id), 'Avertissement retiré');
        setWarned(prev => prev.filter(u => u.id !== id));
    };

    const handleDismissReport = (index) => {
        const updated = reports.filter((_, i) => i !== index);
        setReports(updated);
        localStorage.setItem('gestent_reports', JSON.stringify(updated));
        showMsg('Signalement ignoré');
    };

    const handleHideFromReport = async (critiqueId, index) => {
        await action(s => s.hide(critiqueId), 'Critique masquée');
        handleDismissReport(index);
    };

    if (!user || user.role_id < 2) return null;
    if (loading) return <div className="page-container">Chargement...</div>;

    return (
        <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                <Shield size={28} style={{ color: 'var(--primary)' }} />
                <h1 style={{ fontSize: '1.8rem' }}>Panneau d'administration</h1>
            </div>

            {actionMsg && (
                <div style={{ background: '#14532d', border: '1px solid #22c55e', borderRadius: '8px', padding: '12px 16px', marginBottom: '1rem', color: '#4ade80', fontWeight: 600 }}>
                    ✓ {actionMsg}
                </div>
            )}

            {/* SIGNALEMENTS */}
            <Section title="Signalements" icon={AlertTriangle} count={reports.length} defaultOpen={reports.length > 0}>
                {reports.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun signalement en attente.</p>
                ) : (
                    reports.map((r, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem' }}>Critique #{r.critiqueId}</div>
                                <div style={{ color: 'var(--warning)', fontSize: '0.8rem' }}>Motif : {r.reason}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Par {r.reporterPseudo} · {new Date(r.date).toLocaleDateString()}</div>
                                {r.contenu && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', marginTop: '4px' }}>"{r.contenu}"</div>}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                <button onClick={() => handleHideFromReport(r.critiqueId, i)} title="Masquer la critique"
                                    style={{ background: '#92400e', color: '#fbbf24', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                                    <EyeOff size={12} /> Masquer
                                </button>
                                <button onClick={() => handleDeleteCritique(r.critiqueId, 'report')} title="Supprimer"
                                    style={{ background: '#7f1d1d', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                                    <Trash2 size={12} /> Supprimer
                                </button>
                                <button onClick={() => handleDismissReport(i)} title="Ignorer"
                                    style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                                    Ignorer
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </Section>

            {/* CRITIQUES MASQUÉES */}
            <Section title="Critiques masquées" icon={EyeOff} count={hidden.length}>
                {hidden.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune critique masquée.</p>
                ) : (
                    hidden.map(c => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem' }}>{c.oeuvre_titre || 'Critique #' + c.id}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>par {c.pseudo || 'Utilisateur'} · Note : {c.note}/5</div>
                                {c.contenu && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', marginTop: '2px' }}>"{c.contenu}"</div>}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                <button onClick={() => handleUnhide(c.id)}
                                    style={{ background: '#14532d', color: '#4ade80', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                                    <Eye size={12} /> Rendre visible
                                </button>
                                <button onClick={() => handleDeleteCritique(c.id, 'hidden')}
                                    style={{ background: '#7f1d1d', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                                    <Trash2 size={12} /> Supprimer
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </Section>

            {/* COUPS DE CŒUR */}
            {isAdmin && (
                <Section title="Coups de cœur" icon={Award} count={featured.length}>
                    {featured.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune critique mise en avant.</p>
                    ) : (
                        featured.map(c => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <div style={{ color: 'var(--text)', fontWeight: 600 }}>{c.oeuvre_titre || 'Critique #' + c.id}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>par {c.pseudo || 'Utilisateur'} · Note : {c.note}/5</div>
                                </div>
                                <button onClick={() => handleUnfeature(c.id)}
                                    style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                                    Retirer
                                </button>
                            </div>
                        ))
                    )}
                </Section>
            )}

            {/* UTILISATEURS BANNIS */}
            {isAdmin && (
                <Section title="Utilisateurs bannis" icon={UserX} count={banned.length}>
                    {banned.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun utilisateur banni.</p>
                    ) : (
                        banned.map(u => (
                            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#7f1d1d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontWeight: 700 }}>
                                        {(u.pseudo || '?')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text)', fontWeight: 600 }}>@{u.pseudo}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.email}</div>
                                    </div>
                                </div>
                                <button onClick={() => handleUnban(u.id)}
                                    style={{ background: '#14532d', color: '#4ade80', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                                    <UserCheck size={14} /> Débannir
                                </button>
                            </div>
                        ))
                    )}
                </Section>
            )}

            {/* UTILISATEURS AVERTIS */}
            <Section title="Utilisateurs avertis" icon={AlertTriangle} count={warned.length}>
                {warned.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun utilisateur averti.</p>
                ) : (
                    warned.map(u => (
                        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <div style={{ color: 'var(--text)', fontWeight: 600 }}>@{u.pseudo}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.prenom} {u.nom}</div>
                            </div>
                            <button onClick={() => handleUnwarn(u.id)}
                                style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                                Retirer avertissement
                            </button>
                        </div>
                    ))
                )}
            </Section>
        </div>
    );
}