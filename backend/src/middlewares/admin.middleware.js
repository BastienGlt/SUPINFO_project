const userService = require('../services/user.service');
const logger = require('../utils/logger');

/**
 * Middleware admin : s'assure que l'utilisateur connecté a le role_id = 3 (admin).
 * Doit être utilisé APRÈS checkJwt.
 * Injecte req.currentUser pour éviter un second appel dans le controller.
 */
const checkAdmin = async (req, res, next) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const currentUser = await userService.getUserByAuth0Id(auth0Id);

    if (!currentUser) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    if (currentUser.role_id !== 3) {
      logger.security('UNAUTHORIZED_ADMIN_ACCESS', {
        userId: currentUser.id,
        role_id: currentUser.role_id,
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }

    req.currentUser = currentUser;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = checkAdmin;
