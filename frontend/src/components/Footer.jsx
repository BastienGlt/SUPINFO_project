import React from 'react';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-links">
                    <a href="#mentions">Mentions légales</a>
                    <a href="#cgu">Conditions d'utilisation</a>
                    <a href="#confidentialite">Politique de confidentialité</a>
                    <a href="#contact">Contact</a>
                </div>
                <div>
                    <p style={{ marginBottom: '0.5rem' }}>
                        <strong style={{ color: 'var(--primary)', fontFamily: 'Rajdhani, sans-serif' }}>PROJET SUPINFO</strong> — Réseau social gaming
                    </p>
                    <p>
                        Les données des jeux sont fournies par <a href="https://rawg.io" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>RAWG.io</a>.
                        Ce site est un projet étudiant réalisé dans le cadre de SUPINFO.
                    </p>
                    <p style={{ marginTop: '0.5rem' }}>
                        © {new Date().getFullYear()} Culture Connect — Tous droits réservés.
                    </p>
                </div>
            </div>
        </footer>
    );
}