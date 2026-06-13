const notificationService = require('../services/notification.service');
const userService = require('../services/user.service');
const sse = require('../utils/sse');

/**
 * Controller : Gère les requêtes HTTP pour le système de notifications
 */

/**
 * GET /notifications
 * Récupère les notifications de l'utilisateur connecté.
 */
exports.getNotifications = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const offset = parseInt(req.query.offset) || 0;

    const result = await notificationService.getNotifications(currentUser.id, { limit, offset });
    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des notifications" });
  }
};

/**
 * GET /notifications/unread-count
 * Retourne seulement le nombre de notifications non lues.
 */
exports.countUnread = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const count = await notificationService.countUnread(currentUser.id);
    res.json({ unreadCount: count });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * PUT /notifications/:id/read
 * Marque une notification spécifique comme lue.
 */
exports.markAsRead = async (req, res) => {
  try {
    const notifId = parseInt(req.params.id);
    if (isNaN(notifId) || notifId <= 0) {
      return res.status(400).json({ error: "ID notification invalide" });
    }

    const auth0Id = req.auth.payload.sub;
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const updated = await notificationService.markAsRead(notifId, currentUser.id);
    if (!updated) {
      return res.status(404).json({ error: "Notification introuvable" });
    }

    res.json({ message: "Notification marquée comme lue" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * PUT /notifications/read-all
 * Marque toutes les notifications de l'utilisateur comme lues.
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const count = await notificationService.markAllAsRead(currentUser.id);
    res.json({ message: `${count} notification(s) marquée(s) comme lues` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * GET /notifications/stream
 * Ouvre une connexion SSE persistante.
 * Le client reçoit les nouvelles notifications en temps réel sans polling.
 *
 * Headers SSE obligatoires :
 *  - Content-Type: text/event-stream
 *  - Cache-Control: no-cache
 *  - Connection: keep-alive
 */
exports.stream = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    if (!currentUser) {
      return res.status(401).end();
    }

    // Configuration des headers SSE
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Désactive le buffering nginx si présent
    });
    res.flushHeaders();

    // Envoyer un ping initial pour confirmer la connexion
    res.write(`event: connected\ndata: ${JSON.stringify({ userId: currentUser.id })}\n\n`);

    // Enregistrer la connexion
    sse.addClient(currentUser.id, res);

    // Ping périodique toutes les 30s pour garder la connexion ouverte
    const keepAlive = setInterval(() => {
      res.write(': ping\n\n');
    }, 30000);

    // Nettoyage à la fermeture
    req.on('close', () => {
      clearInterval(keepAlive);
      sse.removeClient(currentUser.id, res);
    });

  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
};
