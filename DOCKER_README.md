# SUPINFO Project - Docker Setup

Application web full-stack de critiques de jeux vidéo avec authentification Auth0.

## Prérequis

- Docker & Docker Compose installés
- Compte Auth0 configuré (ou utiliser les credentials existants)
- Clé API RAWG (optionnel, pour l'intégration jeux vidéo)

## Architecture

- **Frontend** : React + Vite → nginx (port 3000)
- **Backend** : Node.js + Express (port 5000)
- **Base de données** : MySQL 8.0 (port 3306)

## Démarrage rapide avec Docker

### 1. Configuration

Les fichiers `.env` sont déjà configurés avec les valeurs du projet. Si besoin de modifier :

```bash
# Éditer le fichier .env à la racine
nano .env
```

Variables disponibles :
- `DB_PASSWORD` : mot de passe MySQL
- `DB_NAME` : nom de la base de données
- `AUTH0_*` : configuration Auth0 (backend + frontend)
- `VITE_API_URL` : URL de l'API pour le frontend
- `VITE_RAWG_API_KEY` : clé API RAWG

### 2. Lancer l'application

```bash
# Build et démarrage de tous les services
docker compose up --build

# Ou en arrière-plan
docker compose up -d --build
```

### 3. Accès

- **Frontend web** : http://localhost:3000
- **API backend** : http://localhost:5000
- **API docs (Swagger)** : http://localhost:5000/api-docs
- **MySQL** : localhost:3306

### 4. Arrêter l'application

```bash
# Arrêt
docker compose down

# Arrêt + suppression des volumes (⚠️ efface la BDD)
docker compose down -v
```

## Développement local (sans Docker)

### Backend

```bash
cd backend
npm install
npm run dev  # avec nodemon
```

### Frontend

```bash
cd frontend
npm install
npm run dev  # dev server Vite
```

### Base de données

Installer MySQL localement et créer la base de données définie dans `.env`.

## Volumes Docker

- `mysql_data` : données persistantes MySQL (survit aux redémarrages)

## Troubleshooting

### Le backend ne démarre pas
- Vérifier que MySQL est prêt (healthcheck)
- Voir les logs : `docker compose logs backend`

### Le frontend ne charge pas
- Vérifier `VITE_API_URL` dans `.env`
- Rebuild : `docker compose up --build frontend`

### Problème Auth0
- Vérifier `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_AUDIENCE`
- S'assurer que `http://localhost:3000` est dans les Allowed Callback URLs Auth0

### Reset complet

```bash
docker compose down -v
docker compose up --build
```

## Structure du projet

```
.
├── backend/              # API Node.js/Express
│   ├── Dockerfile
│   ├── .dockerignore
│   └── .env             # Config backend locale
├── frontend/            # React/Vite
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .dockerignore
│   └── .env             # Config frontend locale
├── frontend-mobile/     # Expo/React Native (non dockerisé)
├── docker-compose.yml   # Orchestration
└── .env                 # Variables partagées Docker
```

## Notes

- **Frontend mobile** : Expo ne peut pas être dockerisé de manière standard (nécessite émulateur/device physique)
- **Migrations SQL** : Aucune migration automatique configurée, créer manuellement les tables si nécessaire
- **Production** : Modifier `VITE_API_URL` pour pointer vers l'URL de production
