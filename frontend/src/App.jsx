import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './routes/HomePage';
import LoginPage from './routes/LoginPage';
import ProfilePage from './routes/ProfilePage';
import BibliothequePage from './routes/BibliothequePage';
import MessagesPage from './routes/MessagesPage';

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Navbar />
                <div className="main-content">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                        <Route path="/bibliotheque" element={<ProtectedRoute><BibliothequePage /></ProtectedRoute>} />
                        <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}