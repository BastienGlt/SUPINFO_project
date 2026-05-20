const signalementService = require('../services/signalement.service');
const userService = require('../services/user.service');

const TYPES_CONTENU_VALIDES = ['profil', 'commentaire', 'critique'];

/**
 * POST /signalements
 * Créer un signalement
 */
exports.createSignalement = async (req, res) => {
  try {
    const { motif, type_contenu, contenu_id } = req.body;
    const auth0Id = req.auth.payload.sub;

    if (!motif || motif.trim().length === 0) {
      return res.status(400).json({ error: "Le motif est obligatoire" });
    }

    if (motif.length > 100) {
      return res.status(400).json({ error: "Le motif ne peut pas dépasser 100 caractères" });
    }

    if (!type_contenu || !TYPES_CONTENU_VALIDES.includes(type_contenu)) {
      return res.status(400).json({ error: "Le type_contenu doit être 'profil', 'commentaire' ou 'critique'" });
    }

    if (!contenu_id || isNaN(parseInt(contenu_id))) {
      return res.status(400).json({ error: "L'identifiant du contenu est obligatoire" });
    }

    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const signalement = await signalementService.createSignalement(
      currentUser.id,
      type_contenu,
      parseInt(contenu_id),
      motif.trim()
    );

    res.status(201).json(signalement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de créer le signalement" });
  }
};
