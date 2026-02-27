const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const checkJwt = require('../middlewares/auth.middleware');
const checkAdmin = require('../middlewares/admin.middleware');
const checkModerator = require('../middlewares/moderator.middleware');

/**
 * Routes d'administration et de modération
 * Préfixées par /admin dans le routeur principal.
 *
 * Hiérarchie des accès :
 *  checkAdmin     → role_id = 3 uniquement (administrateur)
 *  checkModerator → role_id >= 2 (modérateur ET administrateur)
 */

// ==================== CRITIQUES (admin uniquement) ====================

// Lister les critiques mises en avant
router.get('/critiques/featured', checkJwt, checkAdmin, adminController.getFeaturedCritiques);

// Mettre une critique en avant
router.post('/critiques/:id/feature', checkJwt, checkAdmin, adminController.featureCritique);

// Retirer la mise en avant d'une critique
router.delete('/critiques/:id/feature', checkJwt, checkAdmin, adminController.unfeatureCritique);

// ==================== CRITIQUES (modérateur+) ====================

// Lister les critiques masquées
router.get('/critiques/hidden', checkJwt, checkModerator, adminController.getHiddenCritiques);

// Masquer une critique
router.post('/critiques/:id/hide', checkJwt, checkModerator, adminController.hideCritique);

// Afficher une critique masquée
router.delete('/critiques/:id/hide', checkJwt, checkModerator, adminController.unhideCritique);

// Supprimer une critique
router.delete('/critiques/:id', checkJwt, checkModerator, adminController.deleteCritique);

// ==================== COMMENTAIRES (modérateur+) ====================

// Supprimer un commentaire
router.delete('/commentaires/:id', checkJwt, checkModerator, adminController.deleteCommentaire);

// ==================== UTILISATEURS (admin uniquement) ====================

// Lister les utilisateurs bannis
router.get('/users/banned', checkJwt, checkAdmin, adminController.getBannedUsers);

// Bannir un utilisateur
router.put('/users/:id/ban', checkJwt, checkAdmin, adminController.banUser);

// Débannir un utilisateur
router.put('/users/:id/unban', checkJwt, checkAdmin, adminController.unbanUser);

// ==================== UTILISATEURS (modérateur+) ====================

// Lister les utilisateurs avertis
router.get('/users/warned', checkJwt, checkModerator, adminController.getWarnedUsers);

// Avertir un utilisateur
router.put('/users/:id/warn', checkJwt, checkModerator, adminController.warnUser);

// Retirer un avertissement
router.put('/users/:id/unwarn', checkJwt, checkModerator, adminController.unwarnUser);

module.exports = router;
