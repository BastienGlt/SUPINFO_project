import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { DB } from '../services/mockDb';
import { LogOut, Shield, User, Users } from 'lucide-react';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    
    // Jointures pour compteurs
    const followersCount = DB.followers.filter(f => f.user_follow === user.id).length;
    const followingCount = DB.followers.filter(f => f.user_sub === user.id).length;
    const roleLabel = DB.roles.find(r => r.id === user.role_id)?.label || 'Membre';

    return (
        <div className="page-container">
            <div className="profile-card-large">
                <div className="profile-header-bg"></div>
                <div className="profile-content">
                    <img src={user.photo} alt="Avatar" className="profile-avatar-lg" />
                    <h1>{user.prenom} {user.nom}</h1>
                    <h3 className="pseudo">@{user.pseudo}</h3>
                    
                    <div className="stats-row">
                        <div className="stat">
                            <span className="val">{followersCount}</span>
                            <span className="label">Abonnés</span>
                        </div>
                        <div className="stat">
                            <span className="val">{followingCount}</span>
                            <span className="label">Abonnements</span>
                        </div>
                        <div className="stat">
                            <span className="val">{roleLabel}</span>
                            <span className="label">Rôle</span>
                        </div>
                    </div>

                    <div className="bio-section">
                        <h4>Bio</h4>
                        <p>{user.bio}</p>
                    </div>

                    <div className="info-section">
                        <p><strong>Email :</strong> {user.email}</p>
                        <p><strong>Inscrit le :</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>

                    <button onClick={logout} className="btn-danger full-width">
                        <LogOut size={16}/> Se déconnecter
                    </button>
                </div>
            </div>
        </div>
    );
}