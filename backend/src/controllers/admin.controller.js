const adminService = require('../services/admin.service');
const userService = require('../services/user.service');

/**
 * Controller : Administration et Modération
 * Actions admin (role_id = 3) : ban, feature
 * Actions modérateur (role_id >= 2) : delete critique/commentaire, hide critique, warn user
 * req.currentUser est injecté par checkAdmin ou checkModerator middleware.
 */

/**
 * DELETE /admin/critiques/:id
 * Supprime n'importe quelle critique.
 */
exports.deleteCritique = async (req, res) => {
  try {
    const critiqueId = parseInt(req.params.id);
    if (isNaN(critiqueId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const critique = await adminService.getCritiqueById(critiqueId);
    if (!critique) {
      return res.status(404).json({ error: 'Critique non trouvée' });
    }

    await adminService.deleteCritique(critiqueId);
    res.json({ message: 'Critique supprimée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la critique' });
  }
};

/**
 * PUT /admin/users/:id/ban
 * Bannit un utilisateur.
 */
exports.banUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (user.role_id === 3) {
      return res.status(403).json({ error: 'Impossible de bannir un administrateur' });
    }

    const updated = await adminService.banUser(userId);
    if (!updated) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ message: `Utilisateur ${user.pseudo} banni avec succès` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du bannissement' });
  }
};

/**
 * PUT /admin/users/:id/unban
 * Débannit un utilisateur.
 */
exports.unbanUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const updated = await adminService.unbanUser(userId);
    if (!updated) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ message: `Utilisateur ${user.pseudo} débanni avec succès` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du débannissement' });
  }
};

/**
 * POST /admin/critiques/:id/feature
 * Met une critique en avant.
 */
exports.featureCritique = async (req, res) => {
  try {
    const critiqueId = parseInt(req.params.id);
    if (isNaN(critiqueId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const critique = await adminService.getCritiqueById(critiqueId);
    if (!critique) {
      return res.status(404).json({ error: 'Critique non trouvée' });
    }

    await adminService.featureCritique(critiqueId);
    res.json({ message: 'Critique mise en avant avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise en avant' });
  }
};

/**
 * DELETE /admin/critiques/:id/feature
 * Retire une critique de la mise en avant.
 */
exports.unfeatureCritique = async (req, res) => {
  try {
    const critiqueId = parseInt(req.params.id);
    if (isNaN(critiqueId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const critique = await adminService.getCritiqueById(critiqueId);
    if (!critique) {
      return res.status(404).json({ error: 'Critique non trouvée' });
    }

    await adminService.unfeatureCritique(critiqueId);
    res.json({ message: 'Critique retirée de la mise en avant' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du retrait de la mise en avant' });
  }
};

/**
 * GET /admin/critiques/featured
 * Liste toutes les critiques mises en avant.
 */
exports.getFeaturedCritiques = async (req, res) => {
  try {
    const critiques = await adminService.getFeaturedCritiques();
    res.json(critiques);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des critiques en avant' });
  }
};

/**
 * GET /admin/users/banned
 * Liste tous les utilisateurs bannis.
 */
exports.getBannedUsers = async (req, res) => {
  try {
    const users = await adminService.getBannedUsers();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs bannis' });
  }
};

// ==================== MODÉRATION ====================

/**
 * POST /admin/critiques/:id/hide
 * Masque une critique (hidden = true).
 */
exports.hideCritique = async (req, res) => {
  try {
    const critiqueId = parseInt(req.params.id);
    if (isNaN(critiqueId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const critique = await adminService.getCritiqueById(critiqueId);
    if (!critique) {
      return res.status(404).json({ error: 'Critique non trouvée' });
    }

    await adminService.hideCritique(critiqueId);
    res.json({ message: 'Critique masquée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du masquage de la critique' });
  }
};

/**
 * DELETE /admin/critiques/:id/hide
 * Rend une critique de nouveau visible (hidden = false).
 */
exports.unhideCritique = async (req, res) => {
  try {
    const critiqueId = parseInt(req.params.id);
    if (isNaN(critiqueId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const critique = await adminService.getCritiqueById(critiqueId);
    if (!critique) {
      return res.status(404).json({ error: 'Critique non trouvée' });
    }

    await adminService.unhideCritique(critiqueId);
    res.json({ message: 'Critique rendue visible avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du masquage de la critique' });
  }
};

/**
 * GET /admin/critiques/hidden
 * Liste toutes les critiques masquées.
 */
exports.getHiddenCritiques = async (req, res) => {
  try {
    const critiques = await adminService.getHiddenCritiques();
    res.json(critiques);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des critiques masquées' });
  }
};

/**
 * DELETE /admin/commentaires/:id
 * Supprime n'importe quel commentaire.
 */
exports.deleteCommentaire = async (req, res) => {
  try {
    const commentaireId = parseInt(req.params.id);
    if (isNaN(commentaireId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const commentaire = await adminService.getCommentaireById(commentaireId);
    if (!commentaire) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    await adminService.deleteCommentaire(commentaireId);
    res.json({ message: 'Commentaire supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression du commentaire' });
  }
};

/**
 * PUT /admin/users/:id/warn
 * Émet un avertissement à un utilisateur.
 */
exports.warnUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (user.role_id >= 2) {
      return res.status(403).json({ error: 'Impossible d\'avertir un modérateur ou administrateur' });
    }

    await adminService.warnUser(userId);
    res.json({ message: `Utilisateur ${user.pseudo} averti avec succès` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de l\'avertissement' });
  }
};

/**
 * PUT /admin/users/:id/unwarn
 * Retire l'avertissement d'un utilisateur.
 */
exports.unwarnUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    await adminService.unwarnUser(userId);
    res.json({ message: `Avertissement de ${user.pseudo} retiré avec succès` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du retrait de l\'avertissement' });
  }
};

/**
 * GET /admin/users/warned
 * Liste tous les utilisateurs avertis.
 */
exports.getWarnedUsers = async (req, res) => {
  try {
    const users = await adminService.getWarnedUsers();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs avertis' });
  }
};
