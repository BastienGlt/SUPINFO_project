const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feed.controller');
const checkJwt = require('../middlewares/auth.middleware');

/**
 * Routes pour le fil d'actualité
 * Toutes les routes sont préfixées par /feed dans le routeur principal
 */

// Derniers avis publiés par n'importe quel utilisateur, sur n'importe quelle oeuvre (public)
router.get('/latest-reviews', feedController.getLatestReviews);

// Fil d'actualité chronologique de l'utilisateur connecté
router.get('/', checkJwt, feedController.getFeed);

module.exports = router;
