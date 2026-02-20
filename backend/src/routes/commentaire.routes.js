const express = require('express');
const router = express.Router();
const commentaireController = require('../controllers/commentaire.controller');
const checkJwt = require('../middlewares/auth.middleware');

/**
 * Routes pour la gestion des commentaires sur les critiques
 * Préfixe: /commentaires
 */

// POST /critiques/:id - Créer un commentaire sur une critique
router.post('/critiques/:id', checkJwt, commentaireController.createCommentaire);

// GET /critiques/:id - Récupérer tous les commentaires d'une critique
router.get('/critiques/:id', commentaireController.getCommentairesByCritique);

// GET /critiques/:id/count - Obtenir le nombre de commentaires
router.get('/critiques/:id/count', commentaireController.getCommentaireCount);

// GET /users/:id - Récupérer tous les commentaires d'un utilisateur
router.get('/users/:id', commentaireController.getCommentairesByUser);

// PUT /:id - Mettre à jour un commentaire
router.put('/:id', checkJwt, commentaireController.updateCommentaire);

// DELETE /:id - Supprimer un commentaire
router.delete('/:id', checkJwt, commentaireController.deleteCommentaire);

module.exports = router;
