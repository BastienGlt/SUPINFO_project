const listeService = require('../services/liste.service');
const userService = require('../services/user.service');
const oeuvreService = require('../services/oeuvre.service');

class ListeController {

  // Créer une liste
  async createListe(req, res) {
    try {
      const auth0Id = req.auth.payload.sub;
      const currentUser = await userService.getUserByAuth0Id(auth0Id);
      if (!currentUser) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      const data = req.body;

      if (!data.nom) {
        return res.status(400).json({ error: 'Le nom de la liste est requis' });
      }

      const visibilitesValides = ['PUBLIQUE', 'PRIVEE'];
      if (data.visibilite && !visibilitesValides.includes(data.visibilite)) {
        return res.status(400).json({ error: 'Visibilité invalide. Valeurs acceptées : PUBLIQUE, PRIVEE' });
      }

      const listeId = await listeService.createListe(currentUser.id, data);

      res.status(201).json({
        message: 'Liste créée avec succès',
        liste_id: listeId
      });
    } catch (error) {
      console.error('Erreur createListe:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Mettre à jour une liste
  async updateListe(req, res) {
    try {
      const auth0Id = req.auth.payload.sub;
      const currentUser = await userService.getUserByAuth0Id(auth0Id);
      if (!currentUser) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      const { id } = req.params;
      const updates = req.body;

      const visibilitesValides = ['PUBLIQUE', 'PRIVEE'];
      if (updates.visibilite && !visibilitesValides.includes(updates.visibilite)) {
        return res.status(400).json({ error: 'Visibilité invalide. Valeurs acceptées : PUBLIQUE, PRIVEE' });
      }

      const success = await listeService.updateListe(currentUser.id, id, updates);

      if (!success) {
        return res.status(404).json({ error: 'Liste non trouvée' });
      }

      res.json({ message: 'Liste mise à jour avec succès' });
    } catch (error) {
      console.error('Erreur updateListe:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Supprimer une liste
  async deleteListe(req, res) {
    try {
      const auth0Id = req.auth.payload.sub;
      const currentUser = await userService.getUserByAuth0Id(auth0Id);
      if (!currentUser) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      const { id } = req.params;

      const success = await listeService.deleteListe(currentUser.id, id);

      if (!success) {
        return res.status(404).json({ error: 'Liste non trouvée' });
      }

      res.json({ message: 'Liste supprimée avec succès' });
    } catch (error) {
      console.error('Erreur deleteListe:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtenir les listes d'un utilisateur
  async getUserListes(req, res) {
    try {
      const currentUser = await userService.getUserByAuth0Id(req.auth.payload.sub);
      if (!currentUser) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      const userId = req.params.userId || currentUser.id;
      const listes = await listeService.getUserListes(userId, currentUser.id);

      res.json(listes);
    } catch (error) {
      console.error('Erreur getUserListes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtenir une liste spécifique
  async getListe(req, res) {
    try {
      const { id } = req.params;
      const requestUserId = req.auth ? (await userService.getUserByAuth0Id(req.auth.payload.sub))?.id : null;

      const liste = await listeService.getListe(id, requestUserId);

      if (!liste) {
        return res.status(404).json({ error: 'Liste non trouvée ou accès refusé' });
      }

      res.json(liste);
    } catch (error) {
      console.error('Erreur getListe:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtenir les œuvres d'une liste
  async getListeOeuvres(req, res) {
    try {
      const { id } = req.params;
      const requestUserId = req.auth ? (await userService.getUserByAuth0Id(req.auth.payload.sub))?.id : null;

      const oeuvres = await listeService.getListeOeuvres(id, requestUserId);

      if (oeuvres === null) {
        return res.status(404).json({ error: 'Liste non trouvée ou accès refusé' });
      }

      res.json(oeuvres);
    } catch (error) {
      console.error('Erreur getListeOeuvres:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Ajouter une œuvre à une liste
  async addOeuvre(req, res) {
    try {
      const auth0Id = req.auth.payload.sub;
      const currentUser = await userService.getUserByAuth0Id(auth0Id);
      if (!currentUser) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      const { id } = req.params;
      const { api_reference_id, titre, description } = req.body;

      if (!api_reference_id) {
        return res.status(400).json({ error: 'La référence API de l\'œuvre (api_reference_id) est requise' });
      }

      if (!titre || !description) {
        return res.status(400).json({ error: 'Le titre et la description de l\'œuvre sont obligatoires' });
      }

      // Crée l'œuvre en base si elle n'existe pas encore
      const oeuvre = await oeuvreService.findOrCreate(api_reference_id, titre, description);

      await listeService.addOeuvreToListe(currentUser.id, id, oeuvre.id);

      res.status(201).json({ message: 'Œuvre ajoutée à la liste', oeuvre });
    } catch (error) {
      console.error('Erreur addOeuvre:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Retirer une œuvre d'une liste
  async removeOeuvre(req, res) {
    try {
      const auth0Id = req.auth.payload.sub;
      const currentUser = await userService.getUserByAuth0Id(auth0Id);
      if (!currentUser) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      const { id, oeuvreId } = req.params;

      const success = await listeService.removeOeuvreFromListe(currentUser.id, id, oeuvreId);

      if (!success) {
        return res.status(404).json({ error: 'Œuvre non trouvée dans la liste' });
      }

      res.json({ message: 'Œuvre retirée de la liste' });
    } catch (error) {
      console.error('Erreur removeOeuvre:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtenir les listes publiques
  async getPublicListes(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const listes = await listeService.getPublicListes(limit, offset);

      res.json(listes);
    } catch (error) {
      console.error('Erreur getPublicListes:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ListeController();
