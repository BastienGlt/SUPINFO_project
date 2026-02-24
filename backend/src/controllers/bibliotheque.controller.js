const bibliothequeService = require('../services/bibliotheque.service');
const userService = require('../services/user.service');

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
        return res.status(400).json({ error: 'L\'ID de l\'œuvre est requis' });
      }

      const itemId = await bibliothequeService.addToBibliotheque(currentUser.id, oeuvre_id, statut);

      res.status(201).json({
        message: 'Œuvre ajoutée à la bibliothèque',
        item_id: itemId
      });
    } catch (error) {
      console.error('Erreur addItem:', error);
      res.status(500).json({ error: error.message });
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

      const success = await bibliothequeService.updateBibliothequeItem(currentUser.id, id, updates);

      if (!success) {
        return res.status(404).json({ error: 'Item non trouvé' });
      }

      res.json({ message: 'Item mis à jour avec succès' });
    } catch (error) {
      console.error('Erreur updateItem:', error);
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  }

  // Obtenir la bibliothèque de l'utilisateur
  async getBibliotheque(req, res) {
    try {
      const userId = req.params.userId || (await userService.getUserByAuth0Id(req.auth.payload.sub))?.id;
      if (!userId) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      const { statut } = req.query;

      const filters = {};
      if (statut) filters.statut = statut;

      const items = await bibliothequeService.getUserBibliotheque(userId, filters);

      res.json(items);
    } catch (error) {
      console.error('Erreur getBibliotheque:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new BibliothequeController();
