const bibliothequeService = require('../services/bibliotheque.service');
const userService = require('../services/user.service');
const oeuvreService = require('../services/oeuvre.service');

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
      const { api_reference_id, oeuvre_id, titre, description, statut_id, statut } = body;

      if (Object.keys(body).length === 0) {
        return res.status(400).json({
          error: 'Le corps de la requête est vide ou invalide. Envoyez un JSON valide avec oeuvre_id or api_reference_id and statut.'
        });
      }

      // Determine oeuvre: prefer api_reference_id (create/find), otherwise accept oeuvre_id
      let oeuvre;
      if (api_reference_id) {
        if (!titre || !description) {
          return res.status(400).json({ error: 'Titre et description requis lors de la création via api_reference_id' });
        }
        oeuvre = await oeuvreService.findOrCreate(api_reference_id, titre, description);
      } else if (oeuvre_id) {
        oeuvre = { id: oeuvre_id };
      } else {
        return res.status(400).json({ error: 'L\'ID de l\'œuvre (oeuvre_id) ou api_reference_id est requis' });
      }

      // Accept either statut_id (number) or statut (string)
      const statutValue = (statut_id !== undefined) ? statut_id : statut;
      const itemId = await bibliothequeService.addToBibliotheque(currentUser.id, oeuvre.id, statutValue);

      res.status(201).json({
        message: 'Œuvre ajoutée à la bibliothèque',
        item_id: itemId,
        oeuvre
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

      // normalize: allow both statut and statut_id from clients
      if (updates.statut_id !== undefined && updates.statut === undefined) {
        updates.statut = updates.statut_id;
      } else if (updates.statut !== undefined && updates.statut_id === undefined) {
        updates.statut_id = updates.statut;
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

      const { statut, statut_id } = req.query;

      const filters = {};
      if (statut !== undefined) filters.statut = statut;
      if (statut_id !== undefined) filters.statut_id = statut_id;

      const items = await bibliothequeService.getUserBibliotheque(userId, filters);

      res.json(items);
    } catch (error) {
      console.error('Erreur getBibliotheque:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new BibliothequeController();
