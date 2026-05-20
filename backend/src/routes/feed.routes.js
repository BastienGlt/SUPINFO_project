const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feed.controller');
const checkJwt = require('../middlewares/auth.middleware');

/**
 * Routes pour le fil d'actualité
 * Toutes les routes sont préfixées par /feed dans le routeur principal
 */

// Fil d'actualité chronologique de l'utilisateur connecté
router.get('/', checkJwt, feedController.getFeed);

module.exports = router;
