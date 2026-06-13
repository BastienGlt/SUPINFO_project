const ratingService = require('../services/rating.service');
const userService = require('../services/user.service');

/**
 * Controller : Gère les requêtes HTTP pour le système de notation des œuvres
 * Délègue la logique métier au ratingService
 */

/**
 * POST /oeuvres/:id/ratings
 * Créer une note pour une œuvre
 */
exports.createRating = async (req, res) => {
  try {
    const oeuvreId = parseInt(req.params.id);
    const { note, contenu } = req.body;
    const auth0Id = req.auth.payload.sub;

    // Validation de la note
    if (note === undefined || note === null) {
      return res.status(400).json({ error: "La note est obligatoire" });
    }

    if (typeof note !== 'number' || note < 0 || note > 5) {
      return res.status(400).json({ error: "La note doit être un nombre entre 0 et 5" });
    }

    // Récupérer l'utilisateur authentifié
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Vérifier si l'utilisateur a déjà noté cette œuvre
    const existingRating = await ratingService.getRatingByUserAndOeuvre(currentUser.id, oeuvreId);
    if (existingRating) {
      return res.status(409).json({ error: "Vous avez déjà noté cette œuvre. Utilisez PUT pour mettre à jour." });
    }

    // Créer la note
    const rating = await ratingService.createRating(
      currentUser.id,
      oeuvreId,
      note,
      contenu
    );

    res.status(201).json(rating);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de créer la note" });
  }
};

/**
 * PUT /oeuvres/:id/ratings
 * Mettre à jour une note existante pour une œuvre
 */
exports.updateRating = async (req, res) => {
  try {
    const oeuvreId = parseInt(req.params.id);
    const { note, contenu } = req.body;
    const auth0Id = req.auth.payload.sub;

    // Validation de la note
    if (note === undefined || note === null) {
      return res.status(400).json({ error: "La note est obligatoire" });
    }

    if (typeof note !== 'number' || note < 0 || note > 5) {
      return res.status(400).json({ error: "La note doit être un nombre entre 0 et 5" });
    }

    // Récupérer l'utilisateur authentifié
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Vérifier si l'utilisateur a déjà noté cette œuvre
    const existingRating = await ratingService.getRatingByUserAndOeuvre(currentUser.id, oeuvreId);
    if (!existingRating) {
      return res.status(404).json({ error: "Note non trouvée. Utilisez POST pour créer une note." });
    }

    // Mettre à jour la note
    const rating = await ratingService.updateRating(
      currentUser.id,
      oeuvreId,
      note,
      contenu
    );

    res.status(200).json(rating);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de mettre à jour la note" });
  }
};

/**
 * GET /oeuvres/:id/ratings
 * Récupérer toutes les notes d'une œuvre avec statistiques
 */
exports.getRatingsByOeuvre = async (req, res) => {
  try {
    const oeuvreId = parseInt(req.params.id);
    const { limit, offset, orderBy, order } = req.query;

    const options = {
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      orderBy: orderBy || 'created_at',
      order: order || 'DESC'
    };

    const result = await ratingService.getRatingsByOeuvre(oeuvreId, options);
    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de récupérer les notes" });
  }
};

/**
 * GET /oeuvres/:id/ratings/stats
 * Récupérer uniquement les statistiques de notation d'une œuvre
 */
exports.getOeuvreRatingStats = async (req, res) => {
  try {
    const oeuvreId = parseInt(req.params.id);
    const stats = await ratingService.getOeuvreRatingStats(oeuvreId);
    res.status(200).json(stats);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de récupérer les statistiques" });
  }
};

/**
 * GET /users/:id/ratings
 * Récupérer toutes les notes d'un utilisateur
 */
exports.getRatingsByUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { limit, offset } = req.query;

    const options = {
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0
    };

    const result = await ratingService.getRatingsByUser(userId, options);
    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de récupérer les notes de l'utilisateur" });
  }
};

/**
 * GET /users/:id/ratings/:oeuvreId
 * Récupérer la note d'un utilisateur pour une œuvre spécifique
 */
exports.getUserRatingForOeuvre = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const oeuvreId = parseInt(req.params.oeuvreId);

    const rating = await ratingService.getRatingByUserAndOeuvre(userId, oeuvreId);
    
    if (!rating) {
      return res.status(404).json({ error: "Note non trouvée" });
    }

    res.status(200).json(rating);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de récupérer la note" });
  }
};

/**
 * DELETE /ratings/:id
 * Supprimer une note (seul l'auteur peut supprimer sa note)
 */
exports.deleteRating = async (req, res) => {
  try {
    const ratingId = parseInt(req.params.id);
    const auth0Id = req.auth.payload.sub;

    // Récupérer l'utilisateur authentifié
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Vérifier que la note appartient à l'utilisateur
    const rating = await ratingService.getRatingById(ratingId);
    if (!rating) {
      return res.status(404).json({ error: "Note non trouvée" });
    }

    if (rating.user_id !== currentUser.id) {
      return res.status(403).json({ error: "Vous n'êtes pas autorisé à supprimer cette note" });
    }

    // Supprimer la note
    const deleted = await ratingService.deleteRating(ratingId, currentUser.id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Note non trouvée" });
    }

    res.status(200).json({ success: true, message: "Note supprimée avec succès" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de supprimer la note" });
  }
};

/**
 * POST /ratings/:id/like
 * Liker une critique
 */
exports.likeCritique = async (req, res) => {
  try {
    const critiqueId = parseInt(req.params.id);
    const auth0Id = req.auth.payload.sub;

    // Récupérer l'utilisateur authentifié
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Vérifier si l'utilisateur a déjà liké cette critique
    const alreadyLiked = await ratingService.hasLikedCritique(currentUser.id, critiqueId);
    if (alreadyLiked) {
      return res.status(409).json({ error: "Vous avez déjà liké cette critique" });
    }

    const result = await ratingService.likeCritique(currentUser.id, critiqueId);
    res.status(201).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de liker la critique" });
  }
};

/**
 * DELETE /ratings/:id/like
 * Retirer le like d'une critique
 */
exports.unlikeCritique = async (req, res) => {
  try {
    const critiqueId = parseInt(req.params.id);
    const auth0Id = req.auth.payload.sub;

    // Récupérer l'utilisateur authentifié
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Vérifier si l'utilisateur a liké cette critique
    const hasLiked = await ratingService.hasLikedCritique(currentUser.id, critiqueId);
    if (!hasLiked) {
      return res.status(404).json({ error: "Vous n'avez pas liké cette critique" });
    }

    const deleted = await ratingService.unlikeCritique(currentUser.id, critiqueId);
    
    if (!deleted) {
      return res.status(404).json({ error: "Like non trouvé" });
    }

    res.status(200).json({ success: true, message: "Like retiré avec succès" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de retirer le like" });
  }
};

/**
 * PUT /ratings/:id/like
 * Toggle like/unlike d'une critique (Logique unifiée)
 */
exports.toggleLikeCritique = async (req, res) => {
  try {
    const critiqueId = parseInt(req.params.id);
    const auth0Id = req.auth.payload.sub;

    // Récupérer l'utilisateur authentifié
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const result = await ratingService.toggleLikeCritique(currentUser.id, critiqueId);
    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de toggle le like" });
  }
};

/**
 * PUT /oeuvres/:id/ratings/upsert
 * Créer ou mettre à jour une note (logique unifiée)
 */
exports.upsertRating = async (req, res) => {
  try {
    const oeuvreId = parseInt(req.params.id);
    const { note, contenu } = req.body;
    const auth0Id = req.auth.payload.sub;

    // Validation de la note
    if (note === undefined || note === null) {
      return res.status(400).json({ error: "La note est obligatoire" });
    }

    if (typeof note !== 'number' || note < 0 || note > 5) {
      return res.status(400).json({ error: "La note doit être un nombre entre 0 et 5" });
    }

    // Récupérer l'utilisateur authentifié
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Créer ou mettre à jour la note
    const rating = await ratingService.upsertRating(
      currentUser.id,
      oeuvreId,
      note,
      contenu
    );

    res.status(200).json(rating);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de sauvegarder la note" });
  }
};
