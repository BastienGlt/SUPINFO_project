#!/usr/bin/env node
// Génère le fichier .env à la racine (utilisé par docker-compose).
//
// Pour chaque variable, la valeur est choisie dans cet ordre de priorité :
//   1. Variable d'environnement déjà exportée (utile en CI / secrets)
//   2. Valeur présente dans un .env existant (conservée si on relance le script)
//   3. Valeur par défaut (générée pour DB_PASSWORD, sinon celle de .env.example)
//
// En mode interactif (terminal), chaque valeur peut être saisie manuellement
// (Entrée = garder la valeur par défaut proposée).
// En mode non interactif (CI), les valeurs par défaut sont utilisées sans prompt.
//
// Usage : node setup-env.js  (ou npm run setup-env)

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const ENV_FILE = path.join(__dirname, '.env');

function randomPassword() {
  return crypto.randomBytes(16).toString('hex');
}

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
const isInteractive = process.stdin.isTTY && process.stdout.isTTY;

let rl = null;
if (isInteractive) {
  rl = readline.createInterface({ input: process.stdin, output: process.stdout });
}

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// ask(varName, defaultValue) -> valeur retenue pour cette variable
async function ask(varName, defaultValue) {
  const envValue = process.env[varName];
  if (envValue) return envValue;

  const proposed = existingEnv[varName] !== undefined ? existingEnv[varName] : defaultValue;

  if (!isInteractive) return proposed;

  const answer = await question(`${varName} [${proposed}]: `);
  return answer.trim() || proposed;
}

async function main() {
  if (fs.existsSync(ENV_FILE) && isInteractive) {
    const confirm = await question(
      'Un fichier .env existe déjà. Le mettre à jour (les valeurs actuelles seront proposées par défaut) ? [y/N] '
    );
    if (!/^y/i.test(confirm.trim())) {
      console.log('Abandon.');
      rl.close();
      return;
    }
  }

  const DB_PASSWORD = await ask('DB_PASSWORD', randomPassword());
  const DB_NAME = await ask('DB_NAME', 'supinfo_db');
  const DB_HOST = await ask('DB_HOST', 'localhost');
  const DB_USER = await ask('DB_USER', 'root');
  const PORT = await ask('PORT', '5000');
  const AUTH0_AUDIENCE = await ask('AUTH0_AUDIENCE', 'https://your-auth0-tenant.eu.auth0.com/api/v2/');
  const AUTH0_DOMAIN = await ask('AUTH0_DOMAIN', 'your-auth0-tenant.eu.auth0.com');
  const VITE_AUTH0_DOMAIN = await ask('VITE_AUTH0_DOMAIN', AUTH0_DOMAIN);
  const VITE_AUTH0_CLIENT_ID = await ask('VITE_AUTH0_CLIENT_ID', 'your_auth0_client_id');
  const VITE_AUTH0_AUDIENCE = await ask('VITE_AUTH0_AUDIENCE', AUTH0_AUDIENCE);
  const VITE_API_URL = await ask('VITE_API_URL', 'http://localhost:5000');
  const VITE_RAWG_API_KEY = await ask('VITE_RAWG_API_KEY', 'your_rawg_api_key');

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

  fs.writeFileSync(ENV_FILE, content);
  console.log(`Fichier .env généré : ${ENV_FILE}`);

  if (rl) rl.close();
}

main();
