import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import LegalPage from './routes/LegalPage';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationsPage from './routes/NotificationsPage';
import Footer from './components/Footer';
import HomePage from './routes/HomePage';
import ListesPage from './routes/ListesPage';
import LoginPage from './routes/LoginPage';
import ProfilePage from './routes/ProfilePage';
import UserProfilePage from './routes/UserProfilePage';
import FollowListPage from './routes/FollowListPage';
import BibliothequePage from './routes/BibliothequePage';
import MessagesPage from './routes/MessagesPage';
import CompleteProfilePage from './routes/CompleteProfilePage';
import GamePage from './routes/GamePage';
import AdminPage from './routes/AdminPage';

function AuthRedirect({ children }) {
  const { isAuthenticated, isNewUser, user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-container">Chargement...</div>;
  if (isAuthenticated && isNewUser && location.pathname !== '/complete-profile') return <Navigate to="/complete-profile" replace />;
  if (isAuthenticated && user && location.pathname === '/login') return <Navigate to="/profile" replace />;
  return children;
}

function AppLayout() {
  return (
    <>
      <Header />
      <div className="main-content">
        <AuthRedirect>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game/:rawgId" element={<GamePage />} />
            <Route path="/oeuvre/:oeuvreId" element={<GamePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/complete-profile" element={<CompleteProfilePage />} />
            <Route path="/user/:userId" element={<UserProfilePage />} />
            <Route path="/followers/:userId" element={<FollowListPage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/bibliotheque" element={<ProtectedRoute><BibliothequePage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/listes" element={<ProtectedRoute><ListesPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          </Routes>
        </AuthRedirect>
      </div>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}