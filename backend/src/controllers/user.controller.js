const userService = require('../services/user.service');

/**
 * Controller : Gère les requêtes HTTP et appelle les Services
 * Ne contient AUCUNE logique métier ni SQL
 */

/**
 * GET /users?search=<pseudo>
 * Recherche des utilisateurs par pseudo
 */
exports.searchUsers = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.trim().length === 0) {
      return res.status(400).json({ error: "Le paramètre 'search' est requis" });
    }

    const users = await userService.searchUsersByPseudo(search.trim());
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * 1. GET /users/me
 * Vérifie si l'utilisateur existe.
 * - Si OUI : Renvoie les données.
 * - Si NON : Renvoie 404 (Le Front affichera le formulaire d'inscription).
 */
exports.getMe = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    
    // Namespace Supinfo
    const namespace = 'https://supinfo'; 
    const emailFromToken = req.auth.payload[`${namespace}/email`]; 
    const photoFromToken = req.auth.payload[`${namespace}/picture`];

    // Appel du Service (logique métier déléguée)
    const user = await userService.getUserByAuth0Id(auth0Id);

    if (user) {
      return res.json(user);
    }

    // L'utilisateur n'existe pas encore => 404
    return res.status(404).json({ 
      message: "User not found", 
      is_new: true,
      prefill: { email: emailFromToken, photo: photoFromToken } 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * 1.5. GET /users/:id
 * Récupère les informations publiques d'un utilisateur par son ID
 * Utilisé pour afficher les profils d'autres utilisateurs
 */
exports.getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Validation de l'ID
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    // Appel du Service
    const user = await userService.getUserById(userId);

    if (user) {
      return res.json(user);
    }
    return res.status(404).json({ error: "Utilisateur non trouvé" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * 2. POST /users/create
 * Crée l'utilisateur avec les données du formulaire React
 * (Obligatoire car prenom/nom/pseudo sont NOT NULL)
 */
exports.createUser = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const namespace = 'https://supinfo';
    const email = req.auth.payload[`${namespace}/email`]; // Sécurisé via token
    const photo = req.auth.payload[`${namespace}/picture`];

    // Données reçues du formulaire React
    const { prenom, nom, pseudo, bio } = req.body;

    // Validation (sécurité)
    if (!prenom || !nom || !pseudo) {
      return res.status(400).json({ error: "Les champs Prénom, Nom et Pseudo sont obligatoires." });
    }

    // Appel du Service (logique métier déléguée)
    const newUser = await userService.createUser({
      auth0Id,
      email,
      prenom,
      nom,
      pseudo,
      bio,
      photo
    });

    // Succès
    res.status(201).json(newUser);

  } catch (error) {
    // Gestion spécifique : Pseudo ou Email déjà pris
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "Ce pseudo ou cet email est déjà utilisé." });
    }
    console.error(error);
    res.status(500).json({ error: "Impossible de créer le compte." });
  }
};

/**
 * 3. PUT /users/:id
 * Modifie les informations d'un utilisateur
 * Autorisations : L'utilisateur lui-même OU un administrateur
 */
exports.updateUser = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const auth0Id = req.auth.payload.sub;

    // Récupérer l'utilisateur authentifié
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Récupérer l'utilisateur cible
    const targetUser = await userService.getUserById(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérification des permissions (lui-même OU admin)
    const isOwner = currentUser.id === targetUserId;
    const isAdmin = currentUser.role_id === 3; // role_id 3 = admin

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Vous n'avez pas la permission de modifier cet utilisateur" });
    }

    // Données à mettre à jour
    const { prenom, nom, pseudo, bio, photo } = req.body;

    // Appel du Service
    const updatedUser = await userService.updateUser(targetUserId, {
      prenom,
      nom,
      pseudo,
      bio,
      photo
    });

    res.json(updatedUser);

  } catch (error) {
    // Gestion spécifique : Pseudo déjà pris
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "Ce pseudo est déjà utilisé." });
    }
    if (error.message === 'Aucun champ à mettre à jour') {
      return res.status(400).json({ error: "Aucune donnée à mettre à jour" });
    }
    console.error(error);
    res.status(500).json({ error: "Impossible de mettre à jour l'utilisateur" });
  }
};

/**
 * 4. DELETE /users/:id
 * Supprime un utilisateur
 * Autorisations : L'utilisateur lui-même OU un administrateur
 */
exports.deleteUser = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const auth0Id = req.auth.payload.sub;

    // Récupérer l'utilisateur authentifié
    const currentUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Récupérer l'utilisateur cible
    const targetUser = await userService.getUserById(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérification des permissions (lui-même OU admin)
    const isOwner = currentUser.id === targetUserId;
    const isAdmin = currentUser.role_id === 3; // role_id 3 = admin

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Vous n'avez pas la permission de supprimer cet utilisateur" });
    }

    // Appel du Service
    const deleted = await userService.deleteUser(targetUserId);

    if (deleted) {
      res.json({ message: "Utilisateur supprimé avec succès" });
    } else {
      res.status(500).json({ error: "Échec de la suppression" });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de supprimer l'utilisateur" });
  }
};