const express = require('express');
const router = express.Router();
const signalementController = require('../controllers/signalement.controller');
const checkJwt = require('../middlewares/auth.middleware');

// POST /signalements - Signaler un contenu (profil, commentaire, critique)
router.post('/', checkJwt, signalementController.createSignalement);

module.exports = router;
