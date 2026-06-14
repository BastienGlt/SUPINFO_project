import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-links">
                    <Link to="/legal#mentions">Mentions légales</Link>
                    <Link to="/legal#cgu">Conditions d'utilisation</Link>
                    <Link to="/legal#confidentialite">Politique de confidentialité</Link>
                    <Link to="/legal#contact">Contact</Link>
                </div>
                <div>
                    <p style={{ marginBottom: '0.5rem' }}>
                        <strong style={{ color: 'var(--primary)', fontFamily: 'Rajdhani, sans-serif' }}>PROJET SUPINFO</strong> — Réseau social gaming
                    </p>
                    <p>
                        Données de jeux fournies par <a href="https://rawg.io" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>RAWG.io</a>.
                        Projet étudiant SUPINFO — usage éducatif uniquement.
                    </p>
                    <p style={{ marginTop: '0.5rem' }}>
                        © {new Date().getFullYear()} SUPINFO — Tous droits réservés.
                    </p>
                </div>
            </div>
        </footer>
    );
}
