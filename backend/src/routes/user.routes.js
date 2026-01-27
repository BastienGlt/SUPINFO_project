const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const checkJwt = require('../middlewares/auth.middleware');

// Route protégée : Récupère l'utilisateur connecté
router.get('/me', checkJwt, userController.getMe);

// Route publique : Récupère un utilisateur par ID
router.get('/:id', userController.getUserById);

// Route pour CRÉER le profil (envoyée par le formulaire)
router.post('/create', checkJwt, userController.createUser);

// Route pour MODIFIER un utilisateur (lui-même ou admin)
router.put('/:id', checkJwt, userController.updateUser);

// Route pour SUPPRIMER un utilisateur (lui-même ou admin)
router.delete('/:id', checkJwt, userController.deleteUser);

module.exports = router;
