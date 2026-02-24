const listeService = require('../services/liste.service');
const userService = require('../services/user.service');
const { createListeSchema, updateListeSchema } = require('../validators/liste.validator');

class ListeController {

  // Créer une liste
  async createListe(req, res) {
    try {
      const auth0Id = req.auth.payload.sub;
      const currentUser = await userService.getUserByAuth0Id(auth0Id);
      if (!currentUser) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      const parsed = createListeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const listeId = await listeService.createListe(currentUser.id, parsed.data);

      res.status(201).json({
        message: 'Liste créée avec succès',
        liste_id: listeId
      });
    } catch (error) {
      console.error('Erreur createListe:', error);
      res.status(500).json({ error: 'Impossible de créer la liste' });
    }
  }

  // Mettre à jour une liste
  async updateListe(req, res) {
    try {
      const auth0Id = req.auth.payload.sub;
      const currentUser = await userService.getUserByAuth0Id(auth0Id);
      if (!currentUser) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      const { id } = req.params;

      const parsed = updateListeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const success = await listeService.updateListe(currentUser.id, id, parsed.data);

      if (!success) {
        return res.status(404).json({ error: 'Liste non trouvée' });
      }

      res.json({ message: 'Liste mise à jour avec succès' });
    } catch (error) {
      console.error('Erreur updateListe:', error);
      res.status(500).json({ error: 'Impossible de mettre à jour la liste' });
    }
  }

  // Supprimer une liste
  async deleteListe(req, res) {
    try {
      const auth0Id = req.auth.payload.sub;
      const currentUser = await userService.getUserByAuth0Id(auth0Id);
      if (!currentUser) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      const { id } = req.params;

      await listeService.deleteListe(currentUser.id, id);

      res.json({ message: 'Liste supprimée avec succès' });
    } catch (error) {
      if (error.message === 'LISTE_NOT_FOUND') {
        return res.status(404).json({ error: 'Liste non trouvée' });
      }
      if (error.message === 'LISTE_FORBIDDEN') {
        return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à supprimer cette liste' });
      }
      console.error('Erreur deleteListe:', error);
      res.status(500).json({ error: 'Impossible de supprimer la liste' });
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
      res.status(500).json({ error: 'Impossible de récupérer les listes' });
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
      res.status(500).json({ error: 'Impossible de récupérer la liste' });
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
      res.status(500).json({ error: 'Impossible de récupérer les œuvres de la liste' });
    }
  }

  // Ajouter une œuvre à une liste
  async addOeuvre(req, res) {
    try {
      const auth0Id = req.auth.payload.sub;
      const currentUser = await userService.getUserByAuth0Id(auth0Id);
      if (!currentUser) return res.status(401).json({ error: 'Utilisateur non authentifié' });

      const { id } = req.params;
      const { oeuvre_id } = req.body;

      if (!oeuvre_id) {
        return res.status(400).json({ error: "L'ID de l'œuvre est requis" });
      }

      const oeuvreIdInt = parseInt(oeuvre_id);
      if (isNaN(oeuvreIdInt) || oeuvreIdInt <= 0) {
        return res.status(400).json({ error: "L'ID de l'œuvre doit être un entier positif" });
      }

      await listeService.addOeuvreToListe(currentUser.id, id, oeuvreIdInt);

      res.status(201).json({ message: 'Œuvre ajoutée à la liste' });
    } catch (error) {
      console.error('Erreur addOeuvre:', error);
      if (error.message === 'Liste non trouvée ou accès refusé') {
        return res.status(403).json({ error: error.message });
      }
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Cette œuvre est déjà dans la liste' });
      }
      res.status(500).json({ error: 'Impossible d\'ajouter l\'œuvre à la liste' });
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
      if (error.message === 'Liste non trouvée ou accès refusé') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Impossible de retirer l\'œuvre de la liste' });
    }
  }

  // Obtenir les listes publiques
  async getPublicListes(req, res) {
    try {
      const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
      const offset = Math.max(parseInt(req.query.offset) || 0, 0);

      const listes = await listeService.getPublicListes(limit, offset);

      res.json(listes);
    } catch (error) {
      console.error('Erreur getPublicListes:', error);
      res.status(500).json({ error: 'Impossible de récupérer les listes publiques' });
    }
  }
}

module.exports = new ListeController();
