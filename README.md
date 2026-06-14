# SUPCONTENT — Plateforme communautaire de critiques de jeux vidéo

Application web (+ mobile) permettant aux utilisateurs de rechercher des jeux vidéo (via l'API [RAWG](https://rawg.io/apidocs)), de les noter et critiquer, de suivre d'autres joueurs, de gérer une bibliothèque personnelle (à jouer / en cours / terminé), de créer des listes thématiques et de recevoir des notifications. Un panel de modération/administration permet de traiter les signalements.

- 📦 Dépôt Git : [github.com/BastienGlt/SUPINFO_project](https://github.com/BastienGlt/SUPINFO_project)
- 🗄️ Schéma de la base de données (dbdiagram.io) : [SUPINFO Final Project](https://dbdiagram.io/d/SUPINFO-Final-Project-696e03c2d6e030a02470ab42)

## Sommaire

- [Architecture](#architecture)
- [Diagrammes UML](#diagrammes-uml)
- [Démarrage rapide avec Docker](#démarrage-rapide-avec-docker)
- [Configuration (variables d'environnement)](#configuration-variables-denvironnement)
- [Accès aux services](#accès-aux-services)
- [Développement local (sans Docker)](#développement-local-sans-docker)
- [Application mobile (Expo)](#application-mobile-expo)
- [Structure du projet](#structure-du-projet)
- [Base de données](#base-de-données)
- [Documentation API](#documentation-api)
- [Tests](#tests)
- [Dépannage](#dépannage)
- [Documentation utilisateur](#documentation-utilisateur)

## Architecture

| Composant | Stack | Port (Docker) |
|---|---|---|
| **Frontend** | React 18 + Vite, React Router, Auth0 React SDK, servi par nginx en production | `3000` |
| **Backend** | Node.js 20 + Express 5, MySQL2, JWT Auth0 (`express-oauth2-jwt-bearer`), Swagger | `5000` |
| **Base de données** | MySQL 8.0 | `3306` |
| **Mobile** | Expo / React Native (non dockerisé) | — |

Authentification gérée par **Auth0** (OAuth2 / JWT). Les données de jeux (titres, jaquettes, genres, notes globales) proviennent de l'**API RAWG**, les critiques/notes/commentaires sont stockés dans la base MySQL applicative.

## Diagrammes UML

La documentation technique détaillée (diagramme de cas d'utilisation, diagramme de séquence de l'intégration avec l'API RAWG, et modèle de données / schéma de la base) se trouve dans [`docs/diagrammes-uml.md`](docs/diagrammes-uml.md).

## Démarrage rapide avec Docker

### Prérequis

- [Docker](https://www.docker.com/) et Docker Compose (Docker Desktop sur Windows/Mac)
- [Node.js](https://nodejs.org/) (pour exécuter `setup-env.js`, appelé automatiquement par les scripts npm ci-dessous)

### Lancer la stack

```bash
# Build + démarrage de tous les services (db, backend, frontend)
npm run docker:up

# Ou en arrière-plan
npm run docker:up:d

# Build seul (sans démarrer)
npm run docker:build

# Suivre les logs (utile avec docker:up:d)
docker compose logs -f
```

Ces commandes génèrent automatiquement le fichier `.env` à la racine (via `setup-env.js`) avant de lancer `docker compose` — voir [Configuration](#configuration-variables-denvironnement) pour le détail.

Docker enchaîne ensuite automatiquement :
1. Démarrage de **MySQL** et import du schéma initial (`backend/config/schema.sql`) si la base est vide.
2. Attente que MySQL soit en bonne santé (`healthcheck`) avant de démarrer le **backend**.
3. Au démarrage du backend, `initDb.js` applique aussi des **correctifs de schéma idempotents** (colonnes/vues manquantes sur un volume existant plus ancien) — voir [Base de données](#base-de-données).
4. Démarrage du **frontend** (build React servi par nginx).

### Arrêter / réinitialiser

```bash
# Arrêt (les données MySQL sont conservées dans le volume `mysql_data`)
docker compose down

# Arrêt + suppression du volume MySQL (⚠️ efface toutes les données)
docker compose down -v
```

## Configuration (variables d'environnement)

Le fichier `.env` à la racine (utilisé par `docker compose`) est généré automatiquement par `setup-env.js`, exécuté avant chaque commande `npm run docker:*` (et via `npm run setup-env`) :

- si `.env` n'existe pas encore, il est créé avec des valeurs par défaut codées dans `setup-env.js` ;
- une variable d'environnement déjà exportée dans le shell (utile en CI pour injecter des secrets) prend le pas sur la valeur par défaut ;
- si `.env` existe déjà, il **n'est pas régénéré** (vos modifications manuelles sont conservées) — utiliser `node setup-env.js --force` pour le régénérer entièrement ;
- il reste possible d'éditer `.env` à la main après génération (`nano .env`).

| Variable | Description |
|---|---|
| `DB_PASSWORD` | Mot de passe root MySQL |
| `DB_NAME` | Nom de la base de données |
| `AUTH0_DOMAIN` / `AUTH0_AUDIENCE` | Configuration Auth0 côté backend (validation des JWT) |
| `VITE_AUTH0_DOMAIN` / `VITE_AUTH0_CLIENT_ID` / `VITE_AUTH0_AUDIENCE` | Configuration Auth0 côté frontend (SDK React) |
| `VITE_API_URL` | URL de l'API backend, accessible depuis le navigateur (ex. `http://localhost:5000`) |
| `VITE_RAWG_API_KEY` | Clé API [RAWG](https://rawg.io/apidocs) pour récupérer les données des jeux |

> Pour le développement local sans Docker, `backend/` et `frontend/` possèdent leur propre `.env` (voir leurs `.env.example` respectifs) — `setup-env.js` ne gère pas ces fichiers. En revanche, `setup-env.js` génère également `frontend-mobile/.env` (variables `EXPO_PUBLIC_*`, reprises des valeurs `VITE_*` ci-dessus) — voir [Application mobile](#application-mobile-expo).

> En production, pensez à adapter `VITE_API_URL` pour qu'il pointe vers l'URL réelle de l'API backend déployée.

## Accès aux services

| Service | URL |
|---|---|
| Frontend web | http://localhost:3000 |
| API backend | http://localhost:5000 |
| Documentation API (Swagger UI) | http://localhost:5000/api-docs |
| Health check backend | http://localhost:5000/health |
| MySQL | `localhost:3306` |

Pour qu'Auth0 fonctionne, `http://localhost:3000` doit être enregistré dans les **Allowed Callback / Logout / Web Origins URLs** de l'application Auth0.

## Développement local (sans Docker)

### Backend

```bash
cd backend
npm install
npm run dev   # nodemon, redémarrage auto
```

Nécessite une instance MySQL locale et un fichier `backend/.env` (voir `backend/.env.example`). Le schéma est initialisé automatiquement au démarrage (`config/initDb.js`).

### Frontend

```bash
cd frontend
npm install
npm run dev   # serveur de dev Vite (http://localhost:5173)
```

Fichier `frontend/.env` requis (voir `frontend/.env.example`).

### Scripts à la racine

Le `package.json` racine fournit des raccourcis :

```bash
npm run dev               # backend en mode dev
npm run frontend          # frontend en mode dev
npm run mobile            # app mobile (Expo, mode LAN)
npm run tunnel            # app mobile (Expo, mode tunnel)
npm run install           # installe les dépendances backend + frontend + mobile

npm run setup-env         # (re)génère le .env racine (voir Configuration)
npm run docker:up         # génère le .env puis docker compose up --build
npm run docker:up:d       # idem, en arrière-plan (-d)
npm run docker:build      # génère le .env puis docker compose build (sans démarrer)
```

## Application mobile (Expo)

L'app mobile n'est pas dockerisée : elle nécessite un émulateur Android/iOS ou un appareil physique avec [Expo Go](https://expo.dev/go), ainsi que le **backend** lancé et joignable depuis l'appareil.

### 1. Installation

```bash
cd frontend-mobile
npm install
```

### 2. Configuration (`frontend-mobile/.env`)

Le fichier `frontend-mobile/.env` (variables `EXPO_PUBLIC_*`) est généré automatiquement par `setup-env.js`, comme le `.env` racine :

```bash
# Depuis la racine du projet
npm run setup-env
```

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_AUTH0_DOMAIN` / `EXPO_PUBLIC_AUTH0_CLIENT_ID` / `EXPO_PUBLIC_AUTH0_AUDIENCE` | Configuration Auth0 (reprend les valeurs `VITE_AUTH0_*` du `.env` racine) |
| `EXPO_PUBLIC_API_URL` | URL de l'API backend, joignable depuis l'appareil mobile |
| `EXPO_PUBLIC_RAWG_API_KEY` | Clé API [RAWG](https://rawg.io/apidocs) |

> ⚠️ **`EXPO_PUBLIC_API_URL`** : la valeur par défaut `http://localhost:5000` ne fonctionne **pas** sur un appareil physique ou un émulateur Android (`localhost` y désigne l'appareil lui-même, pas votre PC). Remplacez-la par l'adresse IP locale de votre machine sur le réseau, par ex. :
>
> ```
> EXPO_PUBLIC_API_URL=http://192.168.1.21:5000
> ```
>
> (IP locale visible via `ipconfig` sur Windows / `ifconfig` ou `ip a` sur Linux/Mac.) Le backend doit être démarré (`npm run dev`) et l'appareil mobile connecté au **même réseau Wi-Fi** que le PC.

### 3. Démarrer le backend

```bash
npm run dev   # depuis la racine, ou `cd backend && npm run dev`
```

### 4. Lancer l'app mobile

```bash
cd frontend-mobile
npm run lan      # mode LAN (même réseau Wi-Fi)
# ou
npm run tunnel    # mode tunnel (réseaux différents, plus lent)
```

Scannez le QR code affiché avec l'app **Expo Go** (Android) ou l'appareil photo (iOS), ou lancez un émulateur/simulateur depuis le terminal Expo.

### 5. Configuration Auth0

Au démarrage, les logs affichent l'URL de redirection à utiliser (`=== URL À COPIER DANS AUTH0 ===`, de la forme `frontendmobile://...` ou `exp://...`). Ajoutez-la aux **Allowed Callback / Logout URLs** de l'application Auth0 correspondante, sinon la connexion échouera.

## Structure du projet

```
.
├── backend/                  # API Node.js / Express
│   ├── Dockerfile
│   ├── server.js             # point d'entrée, montage des routes
│   ├── config/
│   │   ├── db.js              # pool de connexion MySQL
│   │   ├── initDb.js          # init + correctifs de schéma au démarrage
│   │   └── schema.sql         # schéma complet (tables + vues)
│   ├── src/
│   │   ├── routes/            # définition des endpoints REST
│   │   ├── controllers/        # logique des requêtes HTTP
│   │   ├── services/           # accès base de données
│   │   ├── middlewares/        # auth Auth0, rôles admin/modérateur, statut "actif"
│   │   └── utils/
│   └── swagger.yaml           # spécification OpenAPI
├── frontend/                  # React + Vite
│   ├── Dockerfile             # build multi-stage -> nginx
│   ├── nginx.conf
│   └── src/
│       ├── routes/             # pages (HomePage, GamePage, ProfilePage, AdminPage, ...)
│       ├── components/         # Header, Sidebar, AdvancedSearch, ReportButton, ...
│       ├── context/             # AuthContext (Auth0)
│       ├── hooks/
│       └── services/            # appels API backend + RAWG
├── frontend-mobile/           # app Expo / React Native (non dockerisée)
├── docker-compose.yml         # orchestration db + backend + frontend
└── .env                       # variables partagées par docker compose
```

## Base de données

📊 Schéma visuel interactif : [dbdiagram.io — SUPINFO Final Project](https://dbdiagram.io/d/SUPINFO-Final-Project-696e03c2d6e030a02470ab42)

Le schéma MySQL (`backend/config/schema.sql`) définit notamment :

- **Tables principales** : `users`, `roles`, `statuts`, `oeuvres`, `critiques`, `commentaires`, `likes_critiques`, `bibliotheque_items`, `listes`, `liste_oeuvres`, `followers`, `follow_requests`, `notifications`, `signalements`, `conversations`, `conversation_participants`, `messages`.
- **Vues** : `v_critiques_complete`, `v_commentaires`, `v_bibliotheque_details`, `v_bibliotheque_stats`, `v_bibliotheque_stats_par_statut`, `v_feed_activities`, `v_followers`, `v_notifications`, `v_signalements`, `v_oeuvres_notes_moyennes`.

Au démarrage du backend, `config/initDb.js` :

1. Attend que MySQL soit prêt.
2. Importe `schema.sql` **uniquement si la base est vide** (premier démarrage / volume neuf).
3. Applique ensuite des **correctifs idempotents** (`runPreSchemaPatches`) pour faire évoluer un volume MySQL existant créé avec une version antérieure du schéma (ex. ajout d'une colonne ou (re)création d'une vue manquante) — sans jamais perdre les données déjà présentes.

## Documentation API

La documentation interactive (Swagger UI) est servie par le backend sur `/api-docs` (http://localhost:5000/api-docs). La spécification OpenAPI source se trouve dans `backend/swagger.yaml`.

Toutes les routes (hors `/health`) passent par le middleware `checkActive` qui bloque les comptes bannis, et la plupart nécessitent un token JWT Auth0 (`Authorization: Bearer <token>`).

## Tests

- **Backend** : `backend/test-api.js` (script de vérification manuelle des endpoints).
- **Frontend** : `npm run test` (Vitest) dans `frontend/`.

## Dépannage

| Problème | Solution |
|---|---|
| `failed to connect to the docker API` | Docker Desktop n'est pas démarré — lancer Docker Desktop et réessayer |
| Le backend ne démarre pas | Vérifier la santé de MySQL : `docker compose logs db` puis `docker compose logs backend` |
| Erreur `ER_NO_SUCH_TABLE` sur une vue après mise à jour du code | Redémarrer le backend (`docker compose up -d --build backend`) : les correctifs de schéma (`initDb.js`) (re)créent automatiquement les vues manquantes sur les volumes existants |
| Le frontend ne charge pas / erreurs Auth0 | Vérifier `VITE_API_URL`, `VITE_AUTH0_*` dans `.env`, et que `http://localhost:3000` est bien dans les URLs autorisées Auth0 |
| Port déjà utilisé (3000/5000/3306) | Libérer le port ou adapter le mapping de ports dans `docker-compose.yml` |
| Réinitialisation complète | `docker compose down -v && docker compose up --build` (⚠️ supprime les données MySQL) |

## Documentation utilisateur

Bienvenue sur **SUPCONTENT**, la plateforme communautaire pour découvrir, noter et discuter de vos jeux vidéo préférés.

### Sommaire (guide utilisateur)

1. [Premiers pas](#1-premiers-pas)
2. [Page d'accueil](#2-page-daccueil)
3. [Rechercher un jeu](#3-rechercher-un-jeu)
4. [Fiche d'un jeu](#4-fiche-dun-jeu)
5. [Ma Bibliothèque](#5-ma-bibliothèque)
6. [Mes Listes](#6-mes-listes)
7. [Profil et abonnements](#7-profil-et-abonnements)
8. [Notifications](#8-notifications)
9. [Signaler un contenu](#9-signaler-un-contenu)
10. [Modération et administration](#10-modération-et-administration)
11. [Questions fréquentes](#11-questions-fréquentes)

### 1. Premiers pas

#### Créer un compte / se connecter

1. Cliquez sur **Connexion** dans la barre de navigation.
2. Vous êtes redirigé vers la page d'authentification **Auth0** : connectez-vous (ou créez un compte) avec votre e-mail ou un fournisseur proposé.
3. Lors de votre **première connexion**, vous devez compléter votre profil :
   - **Prénom**, **Nom**, **Pseudo** (obligatoires)
   - **Bio** (optionnelle)
   - Votre avatar est repris automatiquement depuis votre compte Auth0.
4. Validez avec **Créer mon compte**. Vous êtes ensuite redirigé vers votre profil.

#### Se déconnecter

Utilisez le bouton **Déconnexion** (menu latéral ou page profil).

### 2. Page d'accueil

La page d'accueil affiche :

- Une **barre de recherche avancée** (jeux, utilisateurs, listes publiques).
- Si vous êtes connecté : un **fil d'actualité** présentant les critiques, ajouts à des listes et activités récentes des personnes que vous suivez.
- Les **derniers avis publiés** par la communauté (note, contenu, jeu concerné), avec accès direct à la fiche du jeu correspondant.

### 3. Rechercher un jeu

Deux moyens de chercher un jeu (données fournies par RAWG) :

- **Barre de recherche rapide** (en haut, dans l'en-tête) : tapez le nom d'un jeu, une liste de résultats apparaît avec vignette, année et note. Si vous êtes connecté, trois boutons rapides permettent d'ajouter directement le jeu à votre bibliothèque : **Envie**, **En cours (Joue)**, **Terminé**.
- **Recherche avancée** (page d'accueil) : recherche multi-onglets — **Jeux**, **Utilisateurs**, **Listes publiques** — avec filtres par **genre** et **année de sortie**, et bouton de réinitialisation des filtres. Les résultats s'affichent sous forme de grille paginée.

Cliquer sur un jeu, un utilisateur ou une liste ouvre la page correspondante.

### 4. Fiche d'un jeu

La fiche d'un jeu présente :

- Sa **description**, ses **images** et ses informations issues de RAWG (genres, année, note globale).
- La **note moyenne** et le nombre de critiques laissées par les membres de la plateforme.
- La **liste des critiques/avis** des utilisateurs, avec note (1 à 5 étoiles), texte, likes et commentaires.

Si vous êtes connecté, vous pouvez :

- **Ajouter le jeu à votre bibliothèque** avec un statut : *Envie de jouer*, *En cours*, ou *Terminé*.
- **Rédiger votre propre avis** (note + texte), le **modifier** ou le **supprimer**.
- **Aimer (like)** les avis des autres joueurs.
- **Commenter** un avis, et consulter les commentaires existants.
- **Ajouter le jeu à une ou plusieurs de vos listes** personnalisées.
- **Signaler** un avis ou un commentaire problématique (voir [section 10](#10-signaler-un-contenu)).

### 5. Ma Bibliothèque

Accessible via **Ma Collection / Ma Biblio** (menu latéral ou navigation).

- Affiche tous les jeux que vous avez ajoutés, sous forme de tableau : **titre**, **statut** (coloré selon *Envie* / *En cours* / *Terminé*), **date de dernière mise à jour**.
- Vous pouvez **retirer un jeu** de votre collection via le bouton de suppression (une confirmation est demandée).

> Le statut d'un jeu se change directement depuis sa fiche (section 4) ou via les boutons rapides de la barre de recherche.

### 6. Mes Listes

Accessible via **Listes** (utilisateurs connectés).

- **Créer une liste** : nom, description (optionnelle), visibilité **Privée** ou **Publique**.
- **Modifier** ou **supprimer** une liste existante.
- **Déplier une liste** pour voir les jeux qu'elle contient, et **retirer** un jeu individuellement.
- Le nombre de jeux par liste est affiché.

Les listes **publiques** peuvent être retrouvées par les autres utilisateurs via la recherche avancée.

### 7. Profil et abonnements

#### Mon profil

Accessible via **Profil**. Vous y retrouvez :

- Votre **avatar**, **nom/pseudo**, **bio**, **e-mail**, **date d'inscription**.
- Vos statistiques : nombre d'**abonnés** et d'**abonnements** (cliquables pour voir la liste).
- Votre **badge de rôle** (Membre, Modérateur ou Administrateur).
- Si vous êtes modérateur ou administrateur : un accès direct au **panel d'administration**.
- Le bouton **Déconnexion**.

#### Profil d'un autre utilisateur

En cliquant sur le pseudo/avatar d'un autre membre, vous accédez à son profil public : avatar, pseudo, bio, statistiques, date d'inscription, et ses 10 derniers avis publics.

Depuis ce profil, vous pouvez :

- **Suivre** / **Ne plus suivre** cet utilisateur.

#### Listes d'abonnés / abonnements

Depuis votre profil ou celui d'un autre utilisateur, cliquez sur le nombre d'abonnés ou d'abonnements pour afficher la liste correspondante (avatar, nom, bio courte), avec accès direct à chaque profil.

### 8. Notifications

Accessible via l'icône **Notifications** (avec un badge indiquant le nombre de notifications non lues).

Vous êtes notifié lorsque :

- quelqu'un **aime** une de vos critiques ;
- quelqu'un **commente** une de vos critiques ;
- quelqu'un **commence à vous suivre**.

Chaque notification affiche une icône, le pseudo de la personne concernée, une description de l'action et la date. Les notifications non lues sont mises en évidence.

- **Marquer comme lue** une notification individuellement, ou utiliser **Tout marquer comme lu**.

### 9. Signaler un contenu

Sur un avis ou un commentaire, cliquez sur l'icône **drapeau / Signaler** :

1. Choisissez un motif : **Spoiler**, **Insulte**, **Contenu inapproprié**, **Spam**, **Autre**.
2. Validez l'envoi.
3. Une confirmation visuelle s'affiche.

Le signalement est ensuite transmis à l'équipe de modération (voir section suivante).

### 10. Modération et administration

Réservé aux comptes ayant le rôle **Modérateur** ou **Administrateur** (badge visible sur le profil, avec accès au **panel Admin**).

Le panel d'administration comprend plusieurs sections dépliables, avec un compteur indiquant les éléments en attente :

- **Signalements** : liste des contenus signalés (motif + aperçu). Actions possibles : **Masquer**, **Supprimer** ou **Ignorer** le signalement.
- **Critiques masquées** : permet de **rendre visible** à nouveau une critique masquée, ou de la **supprimer** définitivement.
- **Coups de cœur** *(Administrateur uniquement)* : gestion des contenus mis en avant, avec possibilité de **retirer** un coup de cœur.
- **Utilisateurs bannis** *(Administrateur uniquement)* : permet de **débannir** un utilisateur.
- **Utilisateurs avertis** : permet de **retirer un avertissement** appliqué à un utilisateur.

> Un utilisateur banni ne peut plus accéder aux fonctionnalités nécessitant une authentification (blocage appliqué automatiquement sur toutes les routes protégées).

### 11. Questions fréquentes

**Je viens de me connecter mais je ne vois pas mes données / je suis bloqué sur "Compléter mon profil".**
→ Remplissez le formulaire (Prénom, Nom, Pseudo obligatoires) et validez : votre compte applicatif sera créé en lien avec votre identité Auth0.

**Je ne trouve pas un jeu dans la recherche.**
→ Les jeux proviennent de la base RAWG ; vérifiez l'orthographe ou essayez un titre en anglais. Si le jeu n'existe pas encore côté RAWG, il ne pourra pas être ajouté.

**Je n'arrive pas à voir le contenu d'une liste ou d'un profil.**
→ Les listes et profils peuvent être **privés** : seul leur propriétaire peut les consulter en détail.

**Comment retirer un jeu de ma bibliothèque ou d'une liste ?**
→ Depuis **Ma Bibliothèque** ou **Mes Listes**, utilisez le bouton de suppression/retrait correspondant (une confirmation peut être demandée).

**J'ai signalé un contenu, que se passe-t-il ensuite ?**
→ Le signalement est transmis aux modérateurs/administrateurs, qui peuvent masquer ou supprimer le contenu concerné.
