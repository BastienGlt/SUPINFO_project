const bibliothequeService = require('../services/bibliotheque.service');
const userService = require('../services/user.service');
const logger = require('../utils/logger');

const STATUTS_VALIDES = ['A_VOIR', 'EN_COURS', 'TERMINE', 'ABANDONNE'];

class BibliothequeController {

  parseBody(body) {
    if (!body) return {};
    if (typeof body === 'object') return body;
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return {};
      }
    }
    return {};
  }

  // Ajouter une œuvre à la bibliothèque
  async addItem(req, res) {
    try {
      const auth0Id = req.auth.payload.sub;
      const currentUser = await userService.getUserByAuth0Id(auth0Id);
      if (!currentUser) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      const body = this.parseBody(req.body);
      const { oeuvre_id, statut } = body;

      if (Object.keys(body).length === 0) {
        return res.status(400).json({
          error: 'Le corps de la requête est vide ou invalide. Envoyez un JSON valide avec oeuvre_id et statut.'
        });
      }

      if (!oeuvre_id) {
        return res.status(400).json({ error: "L'ID de l'œuvre est requis" });
      }

      const oeuvreIdInt = parseInt(oeuvre_id);
      if (isNaN(oeuvreIdInt) || oeuvreIdInt <= 0) {
        return res.status(400).json({ error: "L'ID de l'œuvre doit être un entier positif" });
      }

      if (statut && !STATUTS_VALIDES.includes(statut)) {
        return res.status(400).json({
          error: `Statut invalide. Valeurs acceptées : ${STATUTS_VALIDES.join(', ')}`
        });
      }

      const itemId = await bibliothequeService.addToBibliotheque(currentUser.id, oeuvreIdInt, statut);

      res.status(201).json({
        message: 'Œuvre ajoutée à la bibliothèque',
        item_id: itemId
      });
    } catch (error) {
      console.error('Erreur addItem:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Cette œuvre est déjà dans votre bibliothèque' });
      }
      res.status(500).json({ error: 'Impossible d\'ajouter l\'œuvre à la bibliothèque' });
    }
  }

  // Mettre à jour un item de la bibliothèque
  async updateItem(req, res) {
    try {
      const auth0Id = req.auth.payload.sub;
      const currentUser = await userService.getUserByAuth0Id(auth0Id);
      if (!currentUser) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      const { id } = req.params;
      const updates = this.parseBody(req.body);

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'Le corps de la requête est vide ou invalide.'
        });
      }

      if (updates.statut && !STATUTS_VALIDES.includes(updates.statut)) {
        return res.status(400).json({
          error: `Statut invalide. Valeurs acceptées : ${STATUTS_VALIDES.join(', ')}`
        });
      }

      const success = await bibliothequeService.updateBibliothequeItem(currentUser.id, id, updates);

      if (!success) {
        return res.status(404).json({ error: 'Item non trouvé' });
      }

      res.json({ message: 'Item mis à jour avec succès' });
    } catch (error) {
      console.error('Erreur updateItem:', error);
      res.status(500).json({ error: 'Impossible de mettre à jour l\'item' });
    }
  }

  // Supprimer un item de la bibliothèque
  async deleteItem(req, res) {
    try {
      const auth0Id = req.auth.payload.sub;
      const currentUser = await userService.getUserByAuth0Id(auth0Id);
      if (!currentUser) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      const { id } = req.params;

      const success = await bibliothequeService.removeFromBibliotheque(currentUser.id, id);

      if (!success) {
        return res.status(404).json({ error: 'Item non trouvé' });
      }

      res.json({ message: 'Item supprimé avec succès' });
    } catch (error) {
      console.error('Erreur deleteItem:', error);
      res.status(500).json({ error: 'Impossible de supprimer l\'item' });
    }
  }

  // Statistiques de la bibliothèque de l'utilisateur
  async getStats(req, res) {
    try {
      const auth0Id = req.auth.payload.sub;
      const currentUser = await userService.getUserByAuth0Id(auth0Id);
      if (!currentUser) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      const stats = await bibliothequeService.getStats(currentUser.id);
      res.json(stats);
    } catch (error) {
      console.error('Erreur getStats:', error);
      res.status(500).json({ error: 'Impossible de récupérer les statistiques' });
    }
  }

  // Obtenir la bibliothèque de l'utilisateur
  async getBibliotheque(req, res) {
    try {
      const auth0Id = req.auth.payload.sub;
      const currentUser = await userService.getUserByAuth0Id(auth0Id);
      if (!currentUser) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      // Déterminer l'ID cible et vérifier les permissions
      const requestedUserId = req.params.userId
        ? parseInt(req.params.userId)
        : currentUser.id;

      if (isNaN(requestedUserId) || requestedUserId <= 0) {
        return res.status(400).json({ error: 'ID utilisateur invalide' });
      }

      // BOLA : seul le propriétaire ou un admin peut consulter une bibliothèque
      const isOwner = currentUser.id === requestedUserId;
      const isAdmin = currentUser.role_id === 3;

      if (!isOwner && !isAdmin) {
        logger.security('UNAUTHORIZED_BIBLIOTHEQUE_ACCESS', {
          currentUserId: currentUser.id,
          requestedUserId,
          ip: req.ip,
        });
        return res.status(403).json({ error: 'Accès non autorisé à cette bibliothèque' });
      }

      const { statut } = req.query;
      const filters = {};
      if (statut) {
        if (!STATUTS_VALIDES.includes(statut)) {
          return res.status(400).json({
            error: `Statut invalide. Valeurs acceptées : ${STATUTS_VALIDES.join(', ')}`
          });
        }
        filters.statut = statut;
      }

      const items = await bibliothequeService.getUserBibliotheque(requestedUserId, filters);
      res.json(items);
    } catch (error) {
      console.error('Erreur getBibliotheque:', error);
      res.status(500).json({ error: 'Impossible de récupérer la bibliothèque' });
    }
  }
}

module.exports = new BibliothequeController();
