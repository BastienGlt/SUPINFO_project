const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const checkJwt = require('../middlewares/auth.middleware');

/**
 * Routes pour le système de notifications
 * Toutes les routes sont préfixées par /notifications dans le routeur principal
 */

// Connexion SSE temps réel — doit être avant /:id pour éviter tout conflit
router.get('/stream', checkJwt, notificationController.stream);

// Nombre de notifications non lues
router.get('/unread-count', checkJwt, notificationController.countUnread);

// Marquer toutes comme lues — doit être avant /:id/read
router.put('/read-all', checkJwt, notificationController.markAllAsRead);

// Liste des notifications
router.get('/', checkJwt, notificationController.getNotifications);

// Marquer une notification spécifique comme lue
router.put('/:id/read', checkJwt, notificationController.markAsRead);

// Supprimer une notification
router.delete('/:id', checkJwt, notificationController.deleteNotification);
module.exports = router;
