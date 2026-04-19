import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './routes/HomePage';
import LoginPage from './routes/LoginPage';
import ProfilePage from './routes/ProfilePage';
import BibliothequePage from './routes/BibliothequePage';
import MessagesPage from './routes/MessagesPage';
import CompleteProfilePage from './routes/CompleteProfilePage';

/**
 * Gère les redirections après le retour d'Auth0 :
 * - Authentifié + nouveau → /complete-profile
 * - Authentifié + profil OK + sur /login → /profile
 * - Sinon → ne fait rien
 */
function AuthRedirect({ children }) {
  const { isAuthenticated, isNewUser, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-container">Chargement...</div>;

  // Nouvel utilisateur authentifié → compléter le profil
  if (isAuthenticated && isNewUser && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // Utilisateur connecté avec profil qui est encore sur /login → rediriger
  if (isAuthenticated && user && location.pathname === '/login') {
    return <Navigate to="/profile" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="main-content">
          <AuthRedirect>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/complete-profile" element={<CompleteProfilePage />} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/bibliotheque" element={<ProtectedRoute><BibliothequePage /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            </Routes>
          </AuthRedirect>
        </div>
      </Router>
    </AuthProvider>
  );
}