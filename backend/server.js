require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// --- 1. CONFIGURATION ---
app.use(cors());
app.use(express.json());

// --- 2. ROUTES ---
const userRoutes = require('./src/routes/user.routes');
const followerRoutes = require('./src/routes/follower.routes');
const critiqueRoutes = require('./src/routes/critique.routes');

app.use('/users', userRoutes);
app.use('/users', followerRoutes);
app.use('/critiques', critiqueRoutes);

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