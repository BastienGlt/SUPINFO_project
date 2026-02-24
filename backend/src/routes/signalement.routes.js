const express = require('express');
const router = express.Router();
const signalementController = require('../controllers/signalement.controller');
const checkJwt = require('../middlewares/auth.middleware');
const checkModerator = require('../middlewares/moderator.middleware');

/**
 * Routes Signalements
 * Préfixées par /signalements dans le routeur principal.
 *
 * Accès :
 *  - Tout utilisateur authentifié : signaler un contenu, voir ses propres signalements
 *  - Modérateur+ (role_id >= 2)   : voir tous, changer statut, supprimer
 */

// ==================== UTILISATEUR AUTHENTIFIÉ ====================

// Signaler un contenu
router.post('/', checkJwt, signalementController.createSignalement);

// Voir ses propres signalements
router.get('/mes', checkJwt, signalementController.getMesSignalements);

// ==================== MODÉRATEUR+ ====================

// Lister tous les signalements (optionnel : ?statut=en_attente|traité|rejeté)
router.get('/', checkJwt, checkModerator, signalementController.getAllSignalements);

// Mettre à jour le statut d'un signalement
router.put('/:id/statut', checkJwt, checkModerator, signalementController.updateStatut);

// Supprimer un signalement
router.delete('/:id', checkJwt, checkModerator, signalementController.deleteSignalement);

module.exports = router;
