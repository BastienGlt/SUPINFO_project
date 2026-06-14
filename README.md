# ProjetFinal — Plateforme communautaire de critiques de jeux vidéo

Application web (+ mobile) permettant aux utilisateurs de rechercher des jeux vidéo (via l'API [RAWG](https://rawg.io/apidocs)), de les noter et critiquer, de suivre d'autres joueurs, de gérer une bibliothèque personnelle (à jouer / en cours / terminé), de créer des listes thématiques, d'échanger par messagerie privée et de recevoir des notifications. Un panel de modération/administration permet de traiter les signalements.

## Sommaire

- [Architecture](#architecture)
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

> Pour le développement local sans Docker, chaque sous-projet (`backend/`, `frontend/`, `frontend-mobile/`) possède son propre `.env` (voir leurs `.env.example` respectifs) — `setup-env.js` ne gère que le `.env` racine utilisé par Docker.

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

```bash
cd frontend-mobile
npm install
npm run lan      # ou: npm run tunnel
```

Configuration via `frontend-mobile/.env` (variables `EXPO_PUBLIC_*` : API URL, Auth0, clé RAWG). L'app mobile n'est pas dockerisée (nécessite un émulateur ou un appareil physique avec Expo Go).

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
├── DOCKER_README.md           # notes complémentaires Docker
└── .env                       # variables partagées par docker compose
```

## Base de données

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

Le guide d'utilisation de l'application (création de compte, navigation, fonctionnalités) est disponible dans [`docs/GUIDE_UTILISATEUR.md`](docs/GUIDE_UTILISATEUR.md).
