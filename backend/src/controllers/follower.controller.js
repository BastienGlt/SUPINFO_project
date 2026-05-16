const followerService = require('../services/follower.service');
const userService = require('../services/user.service');

/**
 * Controller : Gère les requêtes HTTP pour le système de follow/unfollow
 * Délègue la logique métier au followerService
 */

/**
 * POST /users/:id/follow
 * Permet à l'utilisateur connecté de suivre un autre utilisateur
 */
exports.followUser = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const auth0Id = req.auth.payload.sub;

    // Récupérer l'utilisateur authentifié
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Vérifier que l'utilisateur ne se suit pas lui-même
    if (currentUser.id === targetUserId) {
      return res.status(400).json({ error: "Vous ne pouvez pas vous suivre vous-même" });
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await userService.getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier si l'utilisateur le suit déjà
    const alreadyFollowing = await followerService.isFollowing(currentUser.id, targetUserId);
    if (alreadyFollowing) {
      return res.status(409).json({ error: "Vous suivez déjà cet utilisateur" });
    }

    // Appel du Service
    const result = await followerService.followUser(currentUser.id, targetUserId);
    res.status(201).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de suivre l'utilisateur" });
  }
};

/**
 * DELETE /users/:id/follow
 * Permet à l'utilisateur connecté de ne plus suivre un utilisateur
 */
exports.unfollowUser = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const auth0Id = req.auth.payload.sub;

    // Récupérer l'utilisateur authentifié
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Appel du Service
    const success = await followerService.unfollowUser(currentUser.id, targetUserId);

    if (success) {
      res.json({ message: "Vous ne suivez plus cet utilisateur" });
    } else {
      res.status(404).json({ error: "Vous ne suivez pas cet utilisateur" });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de ne plus suivre l'utilisateur" });
  }
};

/**
 * GET /users/:id/followers
 * Récupère la liste des abonnés d'un utilisateur
 */
exports.getFollowers = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    if (user.public === 0) {
      return res.status(403).json({ error: "Ce compte est privé", is_private: true });
    }

    const followers = await followerService.getFollowers(userId);
    res.json(followers);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * GET /users/:id/following
 * Récupère la liste des abonnements d'un utilisateur
 */
exports.getFollowing = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    if (user.public === 0) {
      return res.status(403).json({ error: "Ce compte est privé", is_private: true });
    }

    const following = await followerService.getFollowing(userId);
    res.json(following);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * GET /users/:id/follow-stats
 * Récupère les statistiques de suivi d'un utilisateur
 */
exports.getFollowStats = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    if (user.public === 0) {
      return res.status(403).json({ error: "Ce compte est privé", is_private: true });
    }

    const stats = await followerService.getFollowStats(userId);
    res.json(stats);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * GET /users/:id/is-following
 * Vérifie si l'utilisateur connecté suit un autre utilisateur
 */
exports.checkIfFollowing = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const auth0Id = req.auth.payload.sub;

    // Validation de l'ID
    if (isNaN(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    // Récupérer l'utilisateur authentifié
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Appel du Service
    const isFollowing = await followerService.isFollowing(currentUser.id, targetUserId);
    res.json({ isFollowing });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};