const commentaireService = require('../services/commentaire.service');
const userService = require('../services/user.service');

/**
 * Controller : Gère les requêtes HTTP pour le système de commentaires
 * Délègue la logique métier au commentaireService
 */

/**
 * POST /critiques/:id/commentaires
 * Créer un commentaire sur une critique
 */
exports.createCommentaire = async (req, res) => {
  try {
    const critiqueId = parseInt(req.params.id);
    const { contenu } = req.body;
    const auth0Id = req.auth.payload.sub;

    // Validation du contenu
    if (!contenu || contenu.trim().length === 0) {
      return res.status(400).json({ error: "Le contenu du commentaire est obligatoire" });
    }

    if (contenu.length > 2000) {
      return res.status(400).json({ error: "Le commentaire ne peut pas dépasser 2000 caractères" });
    }

    // Récupérer l'utilisateur authentifié
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Créer le commentaire
    const commentaire = await commentaireService.createCommentaire(
      currentUser.id,
      critiqueId,
      contenu
    );

    res.status(201).json(commentaire);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de créer le commentaire" });
  }
};

/**
 * GET /critiques/:id/commentaires
 * Récupérer tous les commentaires d'une critique
 */
exports.getCommentairesByCritique = async (req, res) => {
  try {
    const critiqueId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const orderBy = req.query.orderBy || 'created_at';
    const order = req.query.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const result = await commentaireService.getCommentairesByCritique(critiqueId, {
      limit,
      offset,
      orderBy,
      order
    });

    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de récupérer les commentaires" });
  }
};

/**
 * GET /users/:id/commentaires
 * Récupérer tous les commentaires d'un utilisateur
 */
exports.getCommentairesByUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await commentaireService.getCommentairesByUser(userId, {
      limit,
      offset
    });

    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de récupérer les commentaires" });
  }
};

/**
 * PUT /commentaires/:id
 * Mettre à jour un commentaire
 */
exports.updateCommentaire = async (req, res) => {
  try {
    const commentaireId = parseInt(req.params.id);
    const { contenu } = req.body;
    const auth0Id = req.auth.payload.sub;

    // Validation du contenu
    if (!contenu || contenu.trim().length === 0) {
      return res.status(400).json({ error: "Le contenu du commentaire est obligatoire" });
    }

    if (contenu.length > 2000) {
      return res.status(400).json({ error: "Le commentaire ne peut pas dépasser 2000 caractères" });
    }

    // Récupérer l'utilisateur authentifié
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Mettre à jour le commentaire
    const commentaire = await commentaireService.updateCommentaire(
      commentaireId,
      currentUser.id,
      contenu
    );

    res.status(200).json(commentaire);

  } catch (error) {
    console.error(error);
    if (error.message === 'Commentaire non trouvé ou utilisateur non autorisé') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: "Impossible de mettre à jour le commentaire" });
  }
};

/**
 * DELETE /commentaires/:id
 * Supprimer un commentaire
 */
exports.deleteCommentaire = async (req, res) => {
  try {
    const commentaireId = parseInt(req.params.id);
    const auth0Id = req.auth.payload.sub;

    // Récupérer l'utilisateur authentifié
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Supprimer le commentaire
    const deleted = await commentaireService.deleteCommentaire(commentaireId, currentUser.id);

    if (!deleted) {
      return res.status(403).json({ error: "Commentaire non trouvé ou vous n'avez pas les droits pour le supprimer" });
    }

    res.status(200).json({ message: "Commentaire supprimé avec succès" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de supprimer le commentaire" });
  }
};

/**
 * GET /critiques/:id/commentaires/count
 * Obtenir le nombre de commentaires pour une critique
 */
exports.getCommentaireCount = async (req, res) => {
  try {
    const critiqueId = parseInt(req.params.id);
    const count = await commentaireService.getCommentaireCount(critiqueId);
    res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de récupérer le nombre de commentaires" });
  }
};
