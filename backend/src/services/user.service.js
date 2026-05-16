const db = require('../../config/db');

/**
 * Service : Logique métier et requêtes SQL pour les utilisateurs
 * Aucune référence à req/res (Principe de séparation des responsabilités)
 */

/**
 * Récupère un utilisateur via son auth0_id
 * @param {string} auth0Id - L'identifiant Auth0 de l'utilisateur
 * @returns {Object|null} L'utilisateur trouvé ou null
 */
exports.getUserByAuth0Id = async (auth0Id) => {
  const [rows] = await db.query('SELECT * FROM users WHERE auth0_id = ?', [auth0Id]);
  return rows[0] || null;
};

/**
 * Récupère un utilisateur via son ID
 * @param {number} id - L'identifiant de l'utilisateur
 * @returns {Object|null} L'utilisateur trouvé ou null
 */
exports.getUserById = async (id) => {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
};

/**
 * Recherche des utilisateurs par pseudo (recherche partielle)
 * @param {string} pseudo - Le pseudo à rechercher
 * @returns {Array} Liste des utilisateurs correspondants
 */
exports.searchUsersByPseudo = async (pseudo) => {
  const [rows] = await db.query(
    'SELECT id, pseudo, prenom, nom, photo, bio, `public` FROM users WHERE pseudo LIKE ? AND status = ? LIMIT 20',
    [`%${pseudo}%`, 'active']
  );
  return rows;
};

/**
 * Crée un nouvel utilisateur dans la base de données
 * @param {Object} userData - Les données de l'utilisateur à créer
 * @param {string} userData.auth0Id - L'identifiant Auth0
 * @param {string} userData.email - L'email de l'utilisateur
 * @param {string} userData.prenom - Le prénom
 * @param {string} userData.nom - Le nom
 * @param {string} userData.pseudo - Le pseudo (unique)
 * @param {string|null} userData.bio - La biographie (optionnel)
 * @param {string|null} userData.photo - URL de la photo (optionnel)
 * @returns {Object} L'utilisateur créé avec son ID
 */
exports.createUser = async (userData) => {
  const { auth0Id, email, prenom, nom, pseudo, bio, photo } = userData;

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

  return {
    id: result.insertId,
    auth0_id: auth0Id,
    email,
    prenom,
    nom,
    pseudo,
    bio,
    photo,
    role_id: 1
  };
};

/**
 * Met à jour les informations d'un utilisateur
 * @param {number} userId - L'ID de l'utilisateur à modifier
 * @param {Object} updateData - Les données à mettre à jour
 * @param {string} updateData.prenom - Le prénom (optionnel)
 * @param {string} updateData.nom - Le nom (optionnel)
 * @param {string} updateData.pseudo - Le pseudo (optionnel)
 * @param {string} updateData.bio - La biographie (optionnel)
 * @param {string} updateData.photo - URL de la photo (optionnel)
 * @returns {Object} L'utilisateur mis à jour
 */
exports.updateUser = async (userId, updateData) => {
  const { prenom, nom, pseudo, bio, photo } = updateData;
  const isPublic = updateData.public;

  const fields = [];
  const values = [];

  if (prenom !== undefined) {
    fields.push('prenom = ?');
    values.push(prenom);
  }
  if (nom !== undefined) {
    fields.push('nom = ?');
    values.push(nom);
  }
  if (pseudo !== undefined) {
    fields.push('pseudo = ?');
    values.push(pseudo);
  }
  if (bio !== undefined) {
    fields.push('bio = ?');
    values.push(bio);
  }
  if (photo !== undefined) {
    fields.push('photo = ?');
    values.push(photo);
  }
  if (isPublic !== undefined) {
    fields.push('`public` = ?');
    values.push(isPublic ? 1 : 0);
  }
  
  if (fields.length === 0) {
    throw new Error('Aucun champ à mettre à jour');
  }
  
  // Ajouter updated_at
  fields.push('updated_at = NOW()');
  values.push(userId);
  
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  await db.query(sql, values);
  
  // Récupérer et retourner l'utilisateur mis à jour
  return await exports.getUserById(userId);
};

/**
 * Supprime un utilisateur
 * @param {number} userId - L'ID de l'utilisateur à supprimer
 * @returns {boolean} True si la suppression a réussi
 */
exports.deleteUser = async (userId) => {
  const sql = 'DELETE FROM users WHERE id = ?';
  const [result] = await db.query(sql, [userId]);
  return result.affectedRows > 0;
};
