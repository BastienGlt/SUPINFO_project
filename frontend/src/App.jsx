import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './routes/HomePage';
import LoginPage from './routes/LoginPage';
import ProfilePage from './routes/ProfilePage';
import BibliothequePage from './routes/BibliothequePage';
import MessagesPage from './routes/MessagesPage';
import CompleteProfilePage from './routes/CompleteProfilePage';
import GamePage from './routes/GamePage';

function AuthRedirect({ children }) {
  const { isAuthenticated, isNewUser, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-container">Chargement...</div>;

  if (isAuthenticated && isNewUser && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  if (isAuthenticated && user && location.pathname === '/login') {
    return <Navigate to="/profile" replace />;
  }

  return children;
}

function AppLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Header />
      <div className="app-layout">
        {isAuthenticated && <Sidebar />}
        <div className="main-content">
          <AuthRedirect>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/game/:rawgId" element={<GamePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/complete-profile" element={<CompleteProfilePage />} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/bibliotheque" element={<ProtectedRoute><BibliothequePage /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            </Routes>
          </AuthRedirect>
        </div>
      </div>
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