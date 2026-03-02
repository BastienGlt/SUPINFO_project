const feedService = require('../services/feed.service');
const userService = require('../services/user.service');

/**
 * Controller : Fil d'actualité chronologique
 */

/**
 * GET /feed
 * Retourne les activités récentes des utilisateurs suivis.
 * Supporte la pagination via ?limit= et ?offset=
 */
exports.getFeed = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = parseInt(req.query.offset) || 0;

    const result = await feedService.getFeed(currentUser.id, { limit, offset });
    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération du fil d'actualité" });
  }
};
