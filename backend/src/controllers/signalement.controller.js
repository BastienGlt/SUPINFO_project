const signalementService = require('../services/signalement.service');
const userService = require('../services/user.service');
const { createSignalementSchema, updateStatutSchema } = require('../validators/signalement.validator');
const logger = require('../utils/logger');

/**
 * Controller : Signalements de contenu
 *
 * Utilisateur authentifié :
 *  - POST   /signalements              → createSignalement
 *  - GET    /signalements/mes          → getMesSignalements
 *
 * Modérateur+ (role_id >= 2) :
 *  - GET    /signalements              → getAllSignalements  (+ ?statut=)
 *  - PUT    /signalements/:id/statut   → updateStatut
 *  - DELETE /signalements/:id          → deleteSignalement
 */

/**
 * POST /signalements
 * Signale un contenu.
 */
exports.createSignalement = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const parsed = createSignalementSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { type_contenu, contenu_id, motif } = parsed.data;

    const id = await signalementService.createSignalement(
      user.id,
      type_contenu,
      parseInt(contenu_id),
      motif
    );

    res.status(201).json({ message: 'Signalement créé avec succès', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création du signalement' });
  }
};

/**
 * GET /signalements/mes
 * Liste les signalements envoyés par l'utilisateur connecté.
 */
exports.getMesSignalements = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const signalements = await signalementService.getSignalementsByUser(user.id);
    res.json(signalements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération de vos signalements' });
  }
};

/**
 * GET /signalements
 * Liste tous les signalements — modérateur+.
 * Query param optionnel : ?statut=en_attente|traité|rejeté
 */
const STATUTS_FILTRE_AUTORISES = ['en_attente', 'traité', 'rejeté'];

exports.getAllSignalements = async (req, res) => {
  try {
    const { statut } = req.query;

    if (statut && !STATUTS_FILTRE_AUTORISES.includes(statut)) {
      return res.status(400).json({
        error: `statut invalide. Valeurs acceptées : ${STATUTS_FILTRE_AUTORISES.join(', ')}`
      });
    }

    const signalements = await signalementService.getAllSignalements(statut || null);
    res.json(signalements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des signalements' });
  }
};

/**
 * PUT /signalements/:id/statut
 * Met à jour le statut d'un signalement — modérateur+.
 * Body : { statut: 'traité' | 'rejeté' }
 */
exports.updateStatut = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const parsed = updateStatutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const signalement = await signalementService.getSignalementById(id);
    if (!signalement) {
      return res.status(404).json({ error: 'Signalement non trouvé' });
    }

    await signalementService.updateStatut(id, parsed.data.statut);

    logger.security('MODERATOR_UPDATE_SIGNALEMENT', {
      moderatorId: req.currentUser?.id,
      signalementId: id,
      newStatut: parsed.data.statut,
    });

    res.json({ message: `Signalement marqué comme "${parsed.data.statut}"` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
};

/**
 * DELETE /signalements/:id
 * Supprime un signalement — modérateur+.
 */
exports.deleteSignalement = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const signalement = await signalementService.getSignalementById(id);
    if (!signalement) {
      return res.status(404).json({ error: 'Signalement non trouvé' });
    }

    await signalementService.deleteSignalement(id);
    res.json({ message: 'Signalement supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression du signalement' });
  }
};
