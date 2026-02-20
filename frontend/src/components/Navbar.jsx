import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Home, Library, MessageCircle, User, LogIn } from 'lucide-react';

export default function Navbar() {
    const { user } = useAuth();
    const location = useLocation();
    const isActive = (p) => location.pathname === p ? 'active' : '';

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="brand">ProjetFinal</Link>
                <div className="nav-links">
                    <Link to="/" className={`nav-item ${isActive('/')}`}><Home size={18}/> Accueil</Link>
                    {user ? (
                        <>
                            <Link to="/bibliotheque" className={`nav-item ${isActive('/bibliotheque')}`}><Library size={18}/> Ma Biblio</Link>
                            <Link to="/messages" className={`nav-item ${isActive('/messages')}`}><MessageCircle size={18}/> Messages</Link>
                            <Link to="/profile" className={`nav-item ${isActive('/profile')}`}><User size={18}/> Profil</Link>
                        </>
                    ) : (
                        <Link to="/login" className={`nav-item ${isActive('/login')}`}><LogIn size={18}/> Connexion</Link>
                    )}
                </div>
            </div>
        </nav>
    );
}