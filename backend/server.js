require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// --- 1. SÉCURITÉ —  Headers HTTP (helmet supprime X-Powered-By, ajoute ~14 headers) ---
app.use(helmet({
  contentSecurityPolicy: false,       // API JSON pure, pas de rendu HTML
  crossOriginEmbedderPolicy: false,
}));

// --- 2. CORS — Whitelist des origines autorisées ---
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (curl, Postman, serveur-à-serveur)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS : origine ${origin} non autorisée`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

// --- 3. RATE LIMITING ---

// Limite globale : 300 requêtes / 15 min par IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
});

// Limite stricte pour les actions d'écriture (POST, PUT, DELETE)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes d\'écriture. Réessayez dans quelques minutes.' },
});

// Limite très stricte pour l'export (requête lourde en BDD)
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Export limité à 5 fois par heure.' },
});

app.use(globalLimiter);

// --- 4. PARSERS ---
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(express.text({ type: 'text/plain', limit: '100kb' }));

// --- 5. SWAGGER (documentation API) ---
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const yaml = require('js-yaml');

const swaggerDocument = yaml.load(fs.readFileSync('./swagger.yaml', 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- 6. MIDDLEWARE GLOBAL – Vérification statut utilisateur (banni) ---
const checkActive = require('./src/middlewares/active.middleware');
app.use(checkActive);

// --- 7. ROUTES ---
const userRoutes = require('./src/routes/user.routes');
const followerRoutes = require('./src/routes/follower.routes');
const critiqueRoutes = require('./src/routes/critique.routes');
const commentaireRoutes = require('./src/routes/commentaire.routes');
const bibliothequeRoutes = require('./src/routes/bibliotheque.routes');
const listeRoutes = require('./src/routes/liste.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const feedRoutes = require('./src/routes/feed.routes');
const adminRoutes = require('./src/routes/admin.routes');
const signalementRoutes = require('./src/routes/signalement.routes');

// Rate limiting sur les routes d'écriture
app.use('/users/create', writeLimiter);
app.use('/critiques', writeLimiter);
app.use('/commentaires', writeLimiter);
app.use('/bibliotheque/items', writeLimiter);
app.use('/listes', writeLimiter);
app.use('/signalements', writeLimiter);
app.use('/admin', writeLimiter);

// Rate limiting sur l'export RGPD
app.use('/users/me/export', exportLimiter);

app.use('/users', userRoutes);
app.use('/users', followerRoutes);
app.use('/critiques', critiqueRoutes);
app.use('/commentaires', commentaireRoutes);
app.use('/bibliotheque', bibliothequeRoutes);
app.use('/listes', listeRoutes);
app.use('/notifications', notificationRoutes);
app.use('/feed', feedRoutes);
app.use('/admin', adminRoutes);
app.use('/signalements', signalementRoutes);

// --- 8. GESTION DES ERREURS 404 ---
app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

// --- 9. DÉMARRAGE ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur Backend lancé sur le port ${PORT}`);
});
