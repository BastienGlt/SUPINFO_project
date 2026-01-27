require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// --- 1. CONFIGURATION ---
app.use(cors());
app.use(express.json());

// --- 2. ROUTES ---
const userRoutes = require('./src/routes/user.routes');
app.use('/users', userRoutes);

// --- 3. DÉMARRAGE ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Backend lancé sur le port ${PORT}`);
});