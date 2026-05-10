const express = require('express');
const router = express.Router();
const followerController = require('../controllers/follower.controller');
const checkJwt = require('../middlewares/auth.middleware');

/**
 * Routes pour le système de follow/unfollow
 * Toutes les routes sont préfixées par /users dans le routeur principal
 */

// Suivre un utilisateur
router.post('/:id/follow', checkJwt, followerController.followUser);

// Ne plus suivre un utilisateur
router.delete('/:id/follow', checkJwt, followerController.unfollowUser);

// Récupérer la liste des abonnés d'un utilisateur
router.get('/:id/followers', followerController.getFollowers);

// Récupérer la liste des abonnements d'un utilisateur
router.get('/:id/following', followerController.getFollowing);

// Récupérer les statistiques de suivi (nombre d'abonnés/abonnements)
router.get('/:id/follow-stats', followerController.getFollowStats);

// Vérifier si l'utilisateur connecté suit un autre utilisateur
router.get('/:id/is-following', checkJwt, followerController.checkIfFollowing);

module.exports = router;