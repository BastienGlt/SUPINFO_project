#!/usr/bin/env node
// Génère le fichier .env à la racine (utilisé par docker-compose) ainsi que
// frontend-mobile/.env (utilisé par Expo), sans aucune interaction.
//
// Pour chaque variable, la valeur est choisie dans cet ordre de priorité :
//   1. Variable d'environnement déjà exportée (utile en CI / secrets)
//   2. Valeur présente dans un .env existant
//   3. Valeur par défaut codée ci-dessous
//
// Si un fichier existe déjà, le script ne le régénère pas (pour pouvoir être
// chaîné automatiquement avant un build Docker). Utiliser --force pour le
// régénérer.
//
// Usage : node setup-env.js [--force]  (ou npm run setup-env)

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_FILE = path.join(__dirname, '.env');
const MOBILE_ENV_FILE = path.join(__dirname, 'frontend-mobile', '.env');

function parseEnvFile(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    result[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return result;
}

const existingEnv = parseEnvFile(ENV_FILE);

// value(varName, defaultValue) -> valeur retenue pour cette variable
function value(varName, defaultValue) {
  if (process.env[varName]) return process.env[varName];
  if (existingEnv[varName] !== undefined) return existingEnv[varName];
  return defaultValue;
}

function writeEnvFile(filePath, content, force) {
  if (fs.existsSync(filePath) && !force) {
    console.log(`${filePath} existe déjà, génération ignorée (utiliser --force pour régénérer).`);
    return;
  }
  fs.writeFileSync(filePath, content);
  console.log(`Fichier généré : ${filePath}`);
}

function main() {
  const force = process.argv.includes('--force');

  const DB_PASSWORD = value('DB_PASSWORD', crypto.randomBytes(16).toString('hex'));
  const DB_NAME = value('DB_NAME', 'supinfo_db');
  const DB_HOST = value('DB_HOST', 'localhost');
  const DB_USER = value('DB_USER', 'root');
  const PORT = value('PORT', '5000');
  const AUTH0_AUDIENCE = value('AUTH0_AUDIENCE', 'https://dev-7q8y8bzgwgz5k5j1.eu.auth0.com/api/v2/');
  const AUTH0_DOMAIN = value('AUTH0_DOMAIN', 'dev-7q8y8bzgwgz5k5j1.eu.auth0.com');
  const VITE_AUTH0_DOMAIN = value('VITE_AUTH0_DOMAIN', AUTH0_DOMAIN);
  const VITE_AUTH0_CLIENT_ID = value('VITE_AUTH0_CLIENT_ID', 'qlzGka2yy7fleIQt1ikN4Ksu7iWzcDNt');
  const VITE_AUTH0_AUDIENCE = value('VITE_AUTH0_AUDIENCE', AUTH0_AUDIENCE);
  const VITE_API_URL = value('VITE_API_URL', 'http://localhost:5000');
  const VITE_RAWG_API_KEY = value('VITE_RAWG_API_KEY', '795006b9dad04d0e99dbddceab1a8d99');

  const content = `# Base de données MySQL
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
DB_HOST=${DB_HOST}
DB_USER=${DB_USER}

# Backend
PORT=${PORT}

# Auth0 Backend
AUTH0_AUDIENCE=${AUTH0_AUDIENCE}
AUTH0_DOMAIN=${AUTH0_DOMAIN}

# Auth0 Frontend
VITE_AUTH0_DOMAIN=${VITE_AUTH0_DOMAIN}
VITE_AUTH0_CLIENT_ID=${VITE_AUTH0_CLIENT_ID}
VITE_AUTH0_AUDIENCE=${VITE_AUTH0_AUDIENCE}

# URL de l'API backend (accessible depuis le navigateur)
VITE_API_URL=${VITE_API_URL}

# RAWG API Key (pour le frontend)
VITE_RAWG_API_KEY=${VITE_RAWG_API_KEY}
`;

  writeEnvFile(ENV_FILE, content, force);

  const mobileContent = `# Auth0
EXPO_PUBLIC_AUTH0_DOMAIN=${VITE_AUTH0_DOMAIN}
EXPO_PUBLIC_AUTH0_CLIENT_ID=${VITE_AUTH0_CLIENT_ID}
EXPO_PUBLIC_AUTH0_AUDIENCE=${VITE_AUTH0_AUDIENCE}

# URL de l'API backend
EXPO_PUBLIC_API_URL=${VITE_API_URL}

# RAWG API Key
EXPO_PUBLIC_RAWG_API_KEY=${VITE_RAWG_API_KEY}
`;

  writeEnvFile(MOBILE_ENV_FILE, mobileContent, force);
}

main();
