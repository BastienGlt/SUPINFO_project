const db = require('../../config/db');
const notificationService = require('./notification.service');

/**
 * Service : Logique métier pour le système de notation des œuvres
 * Gère les notes et critiques associées aux œuvres
 */

/**
 * Créer une note pour une œuvre
 * @param {number} userId - L'ID de l'utilisateur
 * @param {number} oeuvreId - L'ID de l'œuvre
 * @param {number} note - La note (généralement entre 0 et 5 ou 0 et 10)
 * @param {string} contenu - Le contenu de la critique (optionnel)
 * @returns {Object} La critique créée
 */
exports.createRating = async (userId, oeuvreId, note, contenu = null) => {
  const sql = `
    INSERT INTO critiques (user_id, oeuvre_id, note, contenu, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `;
  const [result] = await db.query(sql, [userId, oeuvreId, note, contenu]);
  return await this.getRatingById(result.insertId);
};

/**
 * Mettre à jour une note existante
 * @param {number} userId - L'ID de l'utilisateur
 * @param {number} oeuvreId - L'ID de l'œuvre
 * @param {number} note - La nouvelle note
 * @param {string} contenu - Le nouveau contenu de la critique (optionnel)
 * @returns {Object} La critique mise à jour
 */
exports.updateRating = async (userId, oeuvreId, note, contenu = null) => {
  const sql = `
    UPDATE critiques 
    SET note = ?, contenu = ?, updated_at = NOW()
    WHERE user_id = ? AND oeuvre_id = ?
  `;
  const [result] = await db.query(sql, [note, contenu, userId, oeuvreId]);
  
  if (result.affectedRows === 0) {
    throw new Error('Note non trouvée ou utilisateur non autorisé');
  }
  
  return await this.getRatingByUserAndOeuvre(userId, oeuvreId);
};

/**
 * Récupérer une note par son ID
 * @param {number} ratingId - L'ID de la critique
 * @returns {Object|null} La critique ou null
 */
exports.getRatingById = async (ratingId) => {
  const sql = `
    SELECT *
    FROM v_critiques_complete
    WHERE id = ?
  `;
  const [rows] = await db.query(sql, [ratingId]);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Récupérer la note d'un utilisateur pour une œuvre spécifique
 * @param {number} userId - L'ID de l'utilisateur
 * @param {number} oeuvreId - L'ID de l'œuvre
 * @returns {Object|null} La critique ou null
 */
exports.getRatingByUserAndOeuvre = async (userId, oeuvreId) => {
  const sql = `
    SELECT *
    FROM v_critiques_complete
    WHERE user_id = ? AND oeuvre_id = ?
  `;
  const [rows] = await db.query(sql, [userId, oeuvreId]);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Récupérer toutes les notes d'une œuvre
 * @param {number} oeuvreId - L'ID de l'œuvre
 * @param {Object} options - Options de pagination et tri
 * @returns {Object} Liste des critiques avec la note moyenne
 */
exports.getRatingsByOeuvre = async (oeuvreId, options = {}) => {
  const { limit = 20, offset = 0, orderBy = 'created_at', order = 'DESC' } = options;
  
  // Récupérer les critiques
  const sql = `
    SELECT *
    FROM v_critiques_complete
    WHERE oeuvre_id = ?
    ORDER BY ${orderBy} ${order}
    LIMIT ? OFFSET ?
  `;
  const [critiques] = await db.query(sql, [oeuvreId, limit, offset]);

  // Récupérer les statistiques
  const stats = await this.getOeuvreRatingStats(oeuvreId);

  return {
    critiques,
    stats,
    pagination: {
      limit,
      offset,
      total: stats.total_ratings
    }
  };
};

/**
 * Récupérer toutes les notes d'un utilisateur
 * @param {number} userId - L'ID de l'utilisateur
 * @param {Object} options - Options de pagination
 * @returns {Array} Liste des critiques de l'utilisateur
 */
exports.getRatingsByUser = async (userId, options = {}) => {
  const { limit = 20, offset = 0 } = options;
  
  const sql = `
    SELECT *
    FROM v_critiques_complete
    WHERE user_id = ?
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `;
  const [critiques] = await db.query(sql, [userId, limit, offset]);

  // Compter le nombre total
  const countSql = 'SELECT COUNT(*) as total FROM critiques WHERE user_id = ?';
  const [countResult] = await db.query(countSql, [userId]);

  return {
    critiques,
    pagination: {
      limit,
      offset,
      total: countResult[0].total
    }
  };
};

/**
 * Obtenir les statistiques de notation d'une œuvre
 * @param {number} oeuvreId - L'ID de l'œuvre
 * @returns {Object} Statistiques (moyenne, nombre de notes, distribution)
 */
exports.getOeuvreRatingStats = async (oeuvreId) => {
  const sql = `
    SELECT 
      COUNT(*) as total_ratings,
      AVG(note) as average_rating,
      MIN(note) as min_rating,
      MAX(note) as max_rating,
      SUM(CASE WHEN note = 5 THEN 1 ELSE 0 END) as rating_5,
      SUM(CASE WHEN note = 4 THEN 1 ELSE 0 END) as rating_4,
      SUM(CASE WHEN note = 3 THEN 1 ELSE 0 END) as rating_3,
      SUM(CASE WHEN note = 2 THEN 1 ELSE 0 END) as rating_2,
      SUM(CASE WHEN note = 1 THEN 1 ELSE 0 END) as rating_1,
      SUM(CASE WHEN note = 0 THEN 1 ELSE 0 END) as rating_0
    FROM critiques
    WHERE oeuvre_id = ?
  `;
  const [rows] = await db.query(sql, [oeuvreId]);
  return rows[0];
};

/**
 * Supprimer une note
 * @param {number} ratingId - L'ID de la critique
 * @param {number} userId - L'ID de l'utilisateur (pour vérification)
 * @returns {boolean} True si supprimée avec succès
 */
exports.deleteRating = async (ratingId, userId) => {
  const sql = 'DELETE FROM critiques WHERE id = ? AND user_id = ?';
  const [result] = await db.query(sql, [ratingId, userId]);
  return result.affectedRows > 0;
};

/**
 * Aimer/Liker une critique
 * @param {number} userId - L'ID de l'utilisateur
 * @param {number} critiqueId - L'ID de la critique
 * @returns {Object} Résultat de l'opération
 */
exports.likeCritique = async (userId, critiqueId) => {
  const sql = `
    INSERT INTO likes_critiques (user_id, critique_id, created_at)
    VALUES (?, ?, NOW())
  `;
  await db.query(sql, [userId, critiqueId]);

  // Récupérer l'auteur de la critique pour le notifier
  const [rows] = await db.query('SELECT user_id FROM critiques WHERE id = ?', [critiqueId]);
  if (rows.length > 0) {
    notificationService.createNotification(rows[0].user_id, userId, 'like', critiqueId).catch(console.error);
  }

  return { success: true, message: 'Critique likée avec succès' };
};

/**
 * Retirer le like d'une critique
 * @param {number} userId - L'ID de l'utilisateur
 * @param {number} critiqueId - L'ID de la critique
 * @returns {boolean} True si unliked avec succès
 */
exports.unlikeCritique = async (userId, critiqueId) => {
  const sql = 'DELETE FROM likes_critiques WHERE user_id = ? AND critique_id = ?';
  const [result] = await db.query(sql, [userId, critiqueId]);
  return result.affectedRows > 0;
};

/**
 * Vérifier si un utilisateur a liké une critique
 * @param {number} userId - L'ID de l'utilisateur
 * @param {number} critiqueId - L'ID de la critique
 * @returns {boolean} True si l'utilisateur a liké la critique
 */
exports.hasLikedCritique = async (userId, critiqueId) => {
  const sql = 'SELECT 1 FROM likes_critiques WHERE user_id = ? AND critique_id = ?';
  const [rows] = await db.query(sql, [userId, critiqueId]);
  return rows.length > 0;
};
