const db = require('../../config/db'); // On l'appelle 'db' pour être cohérent

/**
 * 1. GET /api/users/me
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

    // Vérification BDD
    const [rows] = await db.query('SELECT * FROM users WHERE auth0_id = ?', [auth0Id]);
    let user = rows[0];

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
 * 2. POST /api/users
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

    // Validation manuelle (sécurité extra)
    if (!prenom || !nom || !pseudo) {
      return res.status(400).json({ error: "Les champs Prénom, Nom et Pseudo sont obligatoires." });
    }

    // Insertion
    const sql = `
      INSERT INTO users (auth0_id, email, prenom, nom, pseudo, bio, photo, role_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'active', NOW())
    `;

    const [result] = await db.query(sql, [
      auth0Id,
      email,
      prenom,
      nom,
      pseudo,
      bio || null,
      photo || null
    ]);

    // Succès
    res.status(201).json({ 
      id: result.insertId, 
      auth0_id: auth0Id, 
      pseudo: pseudo, 
      role_id: 1 
    });

  } catch (error) {
    // Gestion spécifique : Pseudo ou Email déjà pris
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "Ce pseudo ou cet email est déjà utilisé." });
    }
    console.error(error);
    res.status(500).json({ error: "Impossible de créer le compte." });
  }
};