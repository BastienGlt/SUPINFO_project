const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const checkJwt = require('../middlewares/auth.middleware');

// Route protégée : Récupère un utilisateur existant
router.get('/me', checkJwt, userController.getMe);
// Route pour CRÉER le profil (envoyée par le formulaire)
router.post('/create', checkJwt, userController.createUser);
module.exports = router;
