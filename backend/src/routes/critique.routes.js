const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');
const checkJwt = require('../middlewares/auth.middleware');

/**
 * Routes pour la gestion des critiques/notes
 * Préfixe: /ratings
 */

router.get('/:id/ratings/stats', ratingController.getOeuvreRatingStats);

// POST /oeuvres/:id/ratings - Créer une note et une critique pour une œuvre
router.post('/:id/ratings', checkJwt, ratingController.createRating);

// PUT /oeuvres/:id/ratings - Mettre à jour une note et une critique pour une œuvre
router.put('/:id/ratings', checkJwt, ratingController.updateRating);

// GET /critiques/:id/ratings/me - Récupérer la note de l'utilisateur connecté pour une œuvre
router.get('/:id/ratings/me', checkJwt, ratingController.getMyRatingForOeuvre);

// GET /oeuvres/:id/ratings - Récupérer toutes les notes d'une œuvre
router.get('/:id/ratings', ratingController.getRatingsByOeuvre);

// DELETE /ratings/:id - Supprimer une critique et une note
router.delete('/:id', checkJwt, ratingController.deleteRating);

//LIKE

// GET /ratings/:id/likes - Récupérer le nombre de likes d'une critique
router.get('/:id/likes', ratingController.getLikesCount);

// POST /ratings/:id/like - Liker une critique
router.post('/:id/like', checkJwt, ratingController.likeCritique);

// DELETE /ratings/:id/like - Retirer le like d'une critique
router.delete('/:id/like', checkJwt, ratingController.unlikeCritique);

module.exports = router;
