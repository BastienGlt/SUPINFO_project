import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Home, Library, MessageCircle, User, LogOut, Gamepad2, TrendingUp } from 'lucide-react';

export default function Sidebar() {
    const { logout } = useAuth();
    const location = useLocation();
    const isActive = (p) => location.pathname === p ? 'active' : '';

    return (
        <aside className="sidebar">
            <div className="sidebar-section">
                <div className="sidebar-title"></div>
                <Link to="/" className={`sidebar-link ${isActive('/')}`}>
                    <Home size={18} /> Accueil
                </Link>
                <Link to="/bibliotheque" className={`sidebar-link ${isActive('/bibliotheque')}`}>
                    <Library size={18} /> Ma Collection
                </Link>
                <Link to="/messages" className={`sidebar-link ${isActive('/messages')}`}>
                    <MessageCircle size={18} /> Messages
                </Link>
                <Link to="/profile" className={`sidebar-link ${isActive('/profile')}`}>
                    <User size={18} /> Profil
                </Link>
            </div>

            <div className="sidebar-section" style={{ marginTop: 'auto' }}>
                <button onClick={logout} className="sidebar-btn">
                    <LogOut size={18} /> Déconnexion
                </button>
            </div>
        </aside>
    );
}