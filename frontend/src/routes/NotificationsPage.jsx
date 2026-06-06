import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createNotificationService } from '../services/notificationService';
import { Bell, Heart, MessageCircle, UserPlus, CheckCheck, Eye } from 'lucide-react';

const TYPE_CONFIG = {
    like: { icon: Heart, color: '#ef4444', label: 'a aimé votre critique' },
    commentaire: { icon: MessageCircle, color: '#3b82f6', label: 'a commenté votre critique' },
    follow: { icon: UserPlus, color: '#22c55e', label: 'a commencé à vous suivre' },
};

export default function NotificationsPage() {
    const { user } = useAuth();
    const { getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const loadNotifications = async () => {
        try {
            const service = createNotificationService(getAccessTokenSilently);
            const data = await service.getAll();
            const list = Array.isArray(data) ? data
                : Array.isArray(data?.notifications) ? data.notifications
                : [];
            setNotifications(list);
            setUnreadCount(data?.unreadCount || list.filter(n => !n.lu).length);
        } catch (err) {
            console.error('Erreur notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();

        // SSE temps réel
        let eventSource;
        const connectSSE = async () => {
            try {
                const token = await getAccessTokenSilently();
                eventSource = new EventSource(
                    `${import.meta.env.VITE_API_URL}/notifications/stream?token=${token}`
                );
                eventSource.addEventListener('notification', (e) => {
                    const notif = JSON.parse(e.data);
                    setNotifications(prev => [notif, ...prev]);
                    setUnreadCount(prev => prev + 1);
                });
                eventSource.onerror = () => {
                    eventSource.close();
                    // Retry après 10s
                    setTimeout(connectSSE, 10000);
                };
            } catch {}
        };
        connectSSE();

        return () => { if (eventSource) eventSource.close(); };
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            const service = createNotificationService(getAccessTokenSilently);
            await service.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) { console.error(err); }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const service = createNotificationService(getAccessTokenSilently);
            await service.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
            setUnreadCount(0);
        } catch (err) { console.error(err); }
    };

    const handleClick = (notif) => {
        if (!notif.lu) handleMarkAsRead(notif.id);
        if (notif.type === 'follow') {
            navigate(`/user/${notif.from_user_id}`);
        } else if (notif.source_id) {
            navigate(`/oeuvre/${notif.source_id}`);
        }
    };

    if (loading) return <div className="page-container">Chargement...</div>;

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bell size={24} style={{ color: 'var(--primary)' }} />
                    <h1 style={{ fontSize: '1.5rem' }}>Notifications</h1>
                    {unreadCount > 0 && (
                        <span style={{
                            background: 'var(--danger)', color: 'white', borderRadius: '10px',
                            padding: '2px 10px', fontSize: '0.8rem', fontWeight: 700,
                        }}>
                            {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} style={{
                        background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
                        padding: '8px 16px', color: 'var(--text-muted)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.9rem',
                    }}>
                        <CheckCheck size={16} /> Tout marquer comme lu
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '3rem', textAlign: 'center',
                }}>
                    <Bell size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Aucune notification.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {notifications.map(notif => {
                        const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.like;
                        const Icon = config.icon;
                        return (
                            <div key={notif.id}
                                onClick={() => handleClick(notif)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '14px',
                                    padding: '14px 18px', borderRadius: '10px', cursor: 'pointer',
                                    background: notif.lu ? 'var(--bg-card)' : 'var(--primary-glow)',
                                    border: notif.lu ? '1px solid var(--border)' : '1px solid var(--primary)',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => { if (notif.lu) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                                onMouseLeave={e => { if (notif.lu) e.currentTarget.style.background = 'var(--bg-card)'; }}
                            >
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: `${config.color}20`, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <Icon size={18} style={{ color: config.color }} />
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                            {notif.from_pseudo || notif.from_prenom || 'Quelqu\'un'}
                                        </span>
                                        {' '}{config.label}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                                        {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                        })}
                                    </div>
                                </div>

                                {!notif.lu && (
                                    <div style={{
                                        width: '10px', height: '10px', borderRadius: '50%',
                                        background: 'var(--primary)', flexShrink: 0,
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}