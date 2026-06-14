import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Scale, FileText, Shield, Mail, ArrowLeft } from 'lucide-react';

export default function LegalPage() {
    const location = useLocation();


    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (hash) {
            setTimeout(() => {
                document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } else {
            window.scrollTo(0, 0);
        }
    }, [location.hash]);

    return (
        <div className="page-container">
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Retour à l'accueil
            </Link>

            {/* Navigation rapide */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '2rem', position: 'sticky', top: 'calc(var(--header-height) + 10px)', zIndex: 10, background: 'var(--bg)', padding: '10px 0' }}>
                <a href="#mentions" style={navStyle}><Scale size={14} /> Mentions légales</a>
                <a href="#cgu" style={navStyle}><FileText size={14} /> CGU</a>
                <a href="#confidentialite" style={navStyle}><Shield size={14} /> Confidentialité</a>
                <a href="#contact" style={navStyle}><Mail size={14} /> Contact</a>
            </div>

            {/* ═══ MENTIONS LÉGALES ═══ */}
            <section id="mentions" style={sectionStyle}>
                <div style={headerStyle}>
                    <Scale size={24} style={{ color: 'var(--primary)' }} />
                    <h2>Mentions légales</h2>
                </div>
                <div className="legal-content">
                    <h3>Éditeur du site</h3>
                    <p>Ce site est un projet étudiant réalisé dans le cadre de la formation SUPINFO International University.</p>
                    <p>Nom du projet : <strong style={{ color: 'var(--text)' }}>PROJET SUPINFO— Réseau social gaming</strong></p>
                    <p>Responsables du projet : PHUNG DANH-CORENTIN - GUILLEMET BASTIEN</p>

                    <h3>Hébergement</h3>
                    <p>Frontend : hébergé localement en développement (Vite.js)</p>
                    <p>Backend API : api-supinfo.bastien-guillemet.fr</p>
                    <p>Authentification : Auth0 (Okta Inc.), hébergé en Union Européenne</p>

                    <h3>Données de jeux</h3>
                    <p>Les métadonnées des jeux vidéo (titres, descriptions, images, dates de sortie, genres, développeurs) sont fournies par l'API <a href="https://rawg.io" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>RAWG.io</a>.</p>
                    <p>Les images, logos et contenus liés aux jeux restent la propriété exclusive de leurs éditeurs et studios respectifs. Ils sont utilisés à des fins informatives et non commerciales.</p>

                    <h3>Propriété intellectuelle</h3>
                    <p>Le code source de cette application est la propriété de l'équipe de développement SUPINFO. Toute reproduction, représentation, modification ou distribution, même partielle, est interdite sans autorisation écrite préalable.</p>
                    <p>Les marques, logos et noms de jeux vidéo cités sur ce site sont la propriété de leurs détenteurs respectifs.</p>

                    <h3>Responsabilité</h3>
                    <p>L'équipe s'efforce de fournir des informations exactes et à jour, mais ne saurait garantir l'exactitude, la complétude ou l'actualité des informations diffusées sur le site. Ce projet est fourni à titre éducatif.</p>
                </div>
            </section>

            {/* ═══ CGU ═══ */}
            <section id="cgu" style={sectionStyle}>
                <div style={headerStyle}>
                    <FileText size={24} style={{ color: 'var(--primary)' }} />
                    <h2>Conditions Générales d'Utilisation</h2>
                </div>
                <div className="legal-content">
                    <h3>Article 1 — Objet</h3>
                    <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme PROJET SUPINFO, un réseau social dédié aux jeux vidéo. En accédant au site, l'utilisateur accepte sans réserve les présentes conditions.</p>

                    <h3>Article 2 — Inscription et compte</h3>
                    <p>L'inscription est gratuite et s'effectue via un compte Google (OAuth2) ou tout autre provider configuré. L'utilisateur s'engage à :</p>
                    <ul style={listStyle}>
                        <li>Fournir des informations exactes lors de la complétion de son profil</li>
                        <li>Maintenir la confidentialité de son compte</li>
                        <li>Ne pas créer de comptes multiples dans un but malveillant</li>
                    </ul>
                    <p>Un visiteur non inscrit peut consulter les contenus publics (avis, fiches de jeux) mais ne peut pas interagir (commenter, noter, suivre).</p>

                    <h3>Article 3 — Contenus utilisateurs</h3>
                    <p>Les utilisateurs peuvent publier des critiques, notes, commentaires et créer des listes. Chaque utilisateur est seul responsable du contenu qu'il publie. Sont strictement interdits :</p>
                    <ul style={listStyle}>
                        <li>Les propos injurieux, diffamatoires, racistes, sexistes ou discriminatoires</li>
                        <li>Les spoilers majeurs non marqués comme tels</li>
                        <li>Le harcèlement envers d'autres utilisateurs</li>
                        <li>Le spam, la publicité non autorisée ou le contenu promotionnel</li>
                        <li>Tout contenu illicite au regard de la loi française</li>
                    </ul>

                    <h3>Article 4 — Modération</h3>
                    <p>Les administrateurs et modérateurs se réservent le droit de :</p>
                    <ul style={listStyle}>
                        <li>Supprimer ou masquer tout contenu jugé inapproprié</li>
                        <li>Avertir les utilisateurs en infraction</li>
                        <li>Bannir temporairement ou définitivement un compte</li>
                        <li>Mettre en avant des critiques de qualité ("Coups de cœur")</li>
                    </ul>
                    <p>Les utilisateurs peuvent signaler un contenu problématique via le bouton de signalement présent sur chaque critique.</p>

                    <h3>Article 5 — Propriété des critiques</h3>
                    <p>Les critiques, notes et avis publiés restent la propriété intellectuelle de leurs auteurs. En les publiant sur PROJET SUPINFO, l'utilisateur accorde à la plateforme une licence non exclusive, gratuite et mondiale d'affichage et de diffusion dans le cadre du service.</p>
                    <p>L'utilisateur peut à tout moment modifier ou supprimer ses propres critiques.</p>

                    <h3>Article 6 — Limitation de responsabilité</h3>
                    <p>PROJET SUPINFO est un projet étudiant fourni "tel quel", sans garantie de disponibilité permanente ni de pérennité. L'équipe ne saurait être tenue responsable :</p>
                    <ul style={listStyle}>
                        <li>Des interruptions temporaires ou permanentes du service</li>
                        <li>De la perte éventuelle de données utilisateur</li>
                        <li>Du contenu publié par les utilisateurs tiers</li>
                        <li>Des informations provenant de l'API RAWG (exactitude, disponibilité)</li>
                    </ul>

                    <h3>Article 7 — Modification des CGU</h3>
                    <p>L'équipe se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle. La poursuite de l'utilisation du service après modification vaut acceptation des nouvelles conditions.</p>
                </div>
            </section>

            {/* ═══ CONFIDENTIALITÉ ═══ */}
            <section id="confidentialite" style={sectionStyle}>
                <div style={headerStyle}>
                    <Shield size={24} style={{ color: 'var(--primary)' }} />
                    <h2>Politique de confidentialité</h2>
                </div>
                <div className="legal-content">
                    <h3>1. Responsable du traitement</h3>
                    <p>Le responsable du traitement des données est l'équipe projet SUPINFO, dans le cadre d'un projet étudiant à vocation éducative.</p>

                    <h3>2. Données collectées</h3>
                    <p>Nous collectons les catégories de données suivantes :</p>
                    <ul style={listStyle}>
                        <li><strong style={{ color: 'var(--text)' }}>Données d'identification</strong> : nom, prénom, pseudo, adresse email, photo de profil (transmises automatiquement par le provider OAuth2 — Google)</li>
                        <li><strong style={{ color: 'var(--text)' }}>Données d'utilisation</strong> : critiques publiées, notes attribuées, jeux ajoutés à la bibliothèque, listes créées, relations d'abonnement, likes et commentaires</li>
                        <li><strong style={{ color: 'var(--text)' }}>Données techniques</strong> : token d'authentification JWT (stocké dans le localStorage du navigateur), préférence de thème (clair/sombre)</li>
                    </ul>

                    <h3>3. Base légale et finalité</h3>
                    <p>Le traitement des données repose sur le consentement de l'utilisateur (acceptation lors de l'inscription). Les données sont utilisées exclusivement pour :</p>
                    <ul style={listStyle}>
                        <li>L'authentification et l'identification des utilisateurs</li>
                        <li>L'affichage du profil public et des activités sociales</li>
                        <li>La gestion de la bibliothèque personnelle et des listes</li>
                        <li>L'envoi de notifications liées à l'activité (likes, commentaires, nouveaux abonnés)</li>
                        <li>La modération des contenus signalés</li>
                    </ul>

                    <h3>4. Partage des données</h3>
                    <p>Vos données personnelles ne sont vendues, louées ou partagées avec aucun tiers commercial. Les seuls sous-traitants techniques sont :</p>
                    <ul style={listStyle}>
                        <li><strong style={{ color: 'var(--text)' }}>Auth0 (Okta Inc.)</strong> : gestion de l'authentification OAuth2, hébergé en UE</li>
                        <li><strong style={{ color: 'var(--text)' }}>RAWG.io</strong> : API de métadonnées de jeux (aucune donnée personnelle transmise)</li>
                    </ul>

                    <h3>5. Durée de conservation</h3>
                    <p>Vos données sont conservées tant que votre compte est actif. En cas de demande de suppression de compte, l'ensemble de vos données personnelles sera effacé dans un délai maximum de 30 jours.</p>

                    <h3>6. Vos droits (RGPD)</h3>
                    <p>Conformément au Règlement Général sur la Protection des Données (UE 2016/679), vous disposez des droits suivants :</p>
                    <ul style={listStyle}>
                        <li><strong style={{ color: 'var(--text)' }}>Droit d'accès</strong> : consulter l'ensemble de vos données personnelles détenues par la plateforme</li>
                        <li><strong style={{ color: 'var(--text)' }}>Droit de rectification</strong> : modifier vos informations personnelles depuis la page Profil</li>
                        <li><strong style={{ color: 'var(--text)' }}>Droit à l'effacement</strong> : demander la suppression définitive de votre compte et de toutes les données associées</li>
                        <li><strong style={{ color: 'var(--text)' }}>Droit à la portabilité</strong> : exporter vos données (critiques, bibliothèque, listes) au format CSV ou JSON depuis les paramètres de votre compte</li>
                        <li><strong style={{ color: 'var(--text)' }}>Droit d'opposition</strong> : vous opposer au traitement de certaines données à caractère personnel</li>
                        <li><strong style={{ color: 'var(--text)' }}>Droit à la limitation</strong> : demander la limitation du traitement de vos données dans les cas prévus par le RGPD</li>
                    </ul>
                    <p>Pour exercer l'un de ces droits, contactez l'équipe via le formulaire de contact ci-dessous ou via la plateforme SUPINFO.</p>

                    <h3>7. Cookies et stockage local</h3>
                    <p>Ce site n'utilise <strong style={{ color: 'var(--text)' }}>aucun cookie de tracking ni publicitaire</strong>. Seul le localStorage du navigateur est utilisé pour :</p>
                    <ul style={listStyle}>
                        <li>Le token d'authentification (session utilisateur)</li>
                        <li>La préférence de thème (clair/sombre)</li>
                        <li>Les signalements en attente de traitement</li>
                    </ul>

                    <h3>8. Sécurité</h3>
                    <p>Les mesures de sécurité suivantes sont mises en place :</p>
                    <ul style={listStyle}>
                        <li>Aucun mot de passe n'est stocké — l'authentification est entièrement déléguée à Auth0 (OAuth2)</li>
                        <li>Toutes les communications sont chiffrées via HTTPS</li>
                        <li>Les tokens JWT ont une durée de vie limitée avec renouvellement automatique</li>
                        <li>Les clés API et secrets ne sont jamais exposés côté client</li>
                    </ul>
                </div>
            </section>

            {/* ═══ CONTACT ═══ */}
            <section id="contact" style={sectionStyle}>
                <div style={headerStyle}>
                    <Mail size={24} style={{ color: 'var(--primary)' }} />
                    <h2>Contact</h2>
                </div>
                <div className="legal-content">
                    <h3>Nous contacter</h3>
                    <p>Pour toute question relative à vos données personnelles, au fonctionnement du site, ou pour signaler un problème :</p>

                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.5rem', marginTop: '1rem' }}>
                        <p style={{ marginBottom: '0.8rem' }}><strong style={{ color: 'var(--text)' }}>PROJET SUPINFO</strong></p>
                        <p>📧 bastien.guillemet@supinfo.com </p>
                        <p>📧 danh-corentin.phung@supinfo.com </p>
                        <p>🏫 SUPINFO Lille</p>
                        <p>📍 France</p>
                    </div>

                    <h3>Signaler un contenu</h3>
                    <p>Si vous rencontrez un contenu inapproprié sur la plateforme, utilisez le bouton de signalement (🚩) disponible sur chaque critique. Un modérateur examinera votre signalement dans les plus brefs délais.</p>

                    <h3>Exercer vos droits RGPD</h3>
                    <p>Pour toute demande relative à vos droits (accès, rectification, suppression, portabilité), envoyez votre demande via par mail à l'adresse bastien.guillemet@supinfo.com :</p>
                    <ul style={listStyle}>
                        <li>Votre pseudo sur PROJET SUPINFO</li>
                        <li>L'adresse email associée à votre compte</li>
                        <li>La nature de votre demande</li>
                    </ul>
                    <p>Nous nous engageons à répondre dans un délai maximum de 30 jours conformément au RGPD.</p>
                </div>
            </section>
        </div>
    );
}

const sectionStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '2rem 2.5rem',
    marginBottom: '1.5rem',
    scrollMarginTop: 'calc(var(--header-height) + 60px)',
};

const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid var(--primary-glow)',
};

const navStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontFamily: 'Rajdhani, sans-serif',
    fontWeight: 700,
    fontSize: '0.85rem',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
};

const listStyle = {
    marginLeft: '1.5rem',
    marginTop: '0.5rem',
    marginBottom: '0.8rem',
    color: 'var(--text-muted)',
};