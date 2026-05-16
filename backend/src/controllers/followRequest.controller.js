const followRequestService = require('../services/followRequest.service');
const userService = require('../services/user.service');

/**
 * POST /follow-requests
 * Envoyer une demande de suivi à un compte privé
 */
exports.createRequest = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const targetId = parseInt(req.body.target_id);

    if (!targetId || isNaN(targetId)) {
      return res.status(400).json({ error: 'target_id est requis' });
    }

    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    if (!currentUser) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    if (currentUser.id === targetId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous envoyer une demande' });
    }

    const targetUser = await userService.getUserById(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const alreadyPending = await followRequestService.hasPendingRequest(currentUser.id, targetId);
    if (alreadyPending) {
      return res.status(409).json({ error: 'Une demande est déjà en attente' });
    }

    const result = await followRequestService.createRequest(currentUser.id, targetId);
    res.status(201).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * GET /follow-requests
 * Voir les demandes de suivi reçues (en attente)
 */
exports.getPendingRequests = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    if (!currentUser) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const requests = await followRequestService.getPendingRequests(currentUser.id);
    res.json(requests);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * PATCH /follow-requests/:id
 * Accepter ou refuser une demande de suivi
 * Body: { action: 'accept' | 'reject' }
 */
exports.respondToRequest = async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const { action } = req.body;
    const auth0Id = req.auth.payload.sub;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action invalide, utilisez "accept" ou "reject"' });
    }

    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    if (!currentUser) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const result = await followRequestService.respondToRequest(requestId, currentUser.id, action);
    if (!result) {
      return res.status(404).json({ error: 'Demande non trouvée ou déjà traitée' });
    }

    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
