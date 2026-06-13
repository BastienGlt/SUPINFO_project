const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const ratingController = require('../controllers/rating.controller');
const checkJwt = require('../middlewares/auth.middleware');
const checkJwtOptional = require('../middlewares/optionalAuth.middleware');

// Route publique : Recherche d'utilisateurs par pseudo
router.get('/', userController.searchUsers);

// Route protégée : Récupère l'utilisateur connecté
router.get('/me', checkJwt, userController.getMe);

// Route pour CRÉER le profil (envoyée par le formulaire)
router.post('/create', checkJwt, userController.createUser);

// GET /users/:id/ratings - Récupérer toutes les notes d'un utilisateur
router.get('/:id/ratings', ratingController.getRatingsByUser);

// GET /users/:id/ratings/:oeuvreId - Récupérer la note d'un utilisateur pour une œuvre spécifique
router.get('/:id/ratings/:oeuvreId', ratingController.getUserRatingForOeuvre);

// Route publique : Récupère un utilisateur par ID
router.get('/:id', checkJwtOptional, userController.getUserById);

// Route pour MODIFIER un utilisateur (lui-même ou admin)
router.put('/:id', checkJwt, userController.updateUser);

// Route pour SUPPRIMER un utilisateur (lui-même ou admin)
router.delete('/:id', checkJwt, userController.deleteUser);

module.exports = router;
