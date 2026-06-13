require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const yaml = require('js-yaml');

const swaggerDocument = yaml.load(fs.readFileSync('./swagger.yaml', 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- 1. CONFIGURATION ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: 'text/plain' }));

// --- 2. ROUTES ---
const checkActive = require('./src/middlewares/active.middleware');

// Bloque les utilisateurs bannis sur toutes les routes authentifiées
app.use(checkActive);

const userRoutes = require('./src/routes/user.routes');
const followerRoutes = require('./src/routes/follower.routes');
const critiqueRoutes = require('./src/routes/critique.routes');
const commentaireRoutes = require('./src/routes/commentaire.routes');
const bibliothequeRoutes = require('./src/routes/bibliotheque.routes');
const listeRoutes = require('./src/routes/liste.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const feedRoutes = require('./src/routes/feed.routes');
const adminRoutes = require('./src/routes/admin.routes');

app.use('/users', userRoutes);
app.use('/users', followerRoutes);
app.use('/critiques', critiqueRoutes);
app.use('/commentaires', commentaireRoutes);
app.use('/bibliotheque', bibliothequeRoutes);
app.use('/listes', listeRoutes);
app.use('/notifications', notificationRoutes);
app.use('/feed', feedRoutes);
app.use('/admin', adminRoutes);

// --- Gestion des erreurs 404 ---
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route introuvable", 
    path: req.path 
  });
});

// --- 3. DÉMARRAGE ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Backend lancé sur le port ${PORT}`);
});