const db = require('../../config/db');
const notificationService = require('./notification.service');

const COMMENTAIRES_ORDER_BY = new Set(['id', 'created_at', 'updated_at']);
const ORDER_DIRECTION = new Set(['ASC', 'DESC']);

/**
 * Service : Logique métier pour le système de commentaires sur les critiques
 * Gère les commentaires associés aux critiques
 */

/**
 * Créer un commentaire sur une critique
 * @param {number} userId - L'ID de l'utilisateur
 * @param {number} critiqueId - L'ID de la critique
 * @param {string} contenu - Le contenu du commentaire
 * @returns {Object} Le commentaire créé
 */
exports.createCommentaire = async (userId, critiqueId, contenu) => {
  const sql = `
    INSERT INTO commentaires (user_id, critique_id, contenu, created_at)
    VALUES (?, ?, ?, NOW())
  `;
  const [result] = await db.query(sql, [userId, critiqueId, contenu]);

  // Récupérer l'auteur de la critique pour le notifier
  const [rows] = await db.query('SELECT user_id FROM critiques WHERE id = ?', [critiqueId]);
  if (rows.length > 0) {
    notificationService.createNotification(rows[0].user_id, userId, 'commentaire', critiqueId).catch(console.error);
  }

  return await this.getCommentaireById(result.insertId);
};

/**
 * Récupérer un commentaire par son ID
 * @param {number} commentaireId - L'ID du commentaire
 * @returns {Object|null} Le commentaire ou null
 */
exports.getCommentaireById = async (commentaireId) => {
  const sql = `
    SELECT *
    FROM v_commentaires
    WHERE id = ?
  `;
  const [rows] = await db.query(sql, [commentaireId]);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Récupérer tous les commentaires d'une critique
 * @param {number} critiqueId - L'ID de la critique
 * @param {Object} options - Options de pagination
 * @returns {Object} Liste des commentaires avec pagination
 */
exports.getCommentairesByCritique = async (critiqueId, options = {}) => {
  const { limit = 50, offset = 0, orderBy = 'created_at', order = 'ASC' } = options;
  const safeOrderBy = COMMENTAIRES_ORDER_BY.has(orderBy) ? orderBy : 'created_at';
  const normalizedOrder = typeof order === 'string' ? order.toUpperCase() : 'ASC';
  const safeOrder = ORDER_DIRECTION.has(normalizedOrder) ? normalizedOrder : 'ASC';
  
  const sql = `
    SELECT *
    FROM v_commentaires
    WHERE critique_id = ?
    ORDER BY ${safeOrderBy} ${safeOrder}
    LIMIT ? OFFSET ?
  `;
  const [commentaires] = await db.query(sql, [critiqueId, limit, offset]);

  // Compter le nombre total
  const countSql = 'SELECT COUNT(*) as total FROM commentaires WHERE critique_id = ?';
  const [countResult] = await db.query(countSql, [critiqueId]);

  return {
    commentaires,
    pagination: {
      limit,
      offset,
      total: countResult[0].total
    }
  };
};

/**
 * Récupérer tous les commentaires d'un utilisateur
 * @param {number} userId - L'ID de l'utilisateur
 * @param {Object} options - Options de pagination
 * @returns {Object} Liste des commentaires avec pagination
 */
exports.getCommentairesByUser = async (userId, options = {}) => {
  const { limit = 20, offset = 0 } = options;
  
  const sql = `
    SELECT *
    FROM v_commentaires
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [commentaires] = await db.query(sql, [userId, limit, offset]);

  // Compter le nombre total
  const countSql = 'SELECT COUNT(*) as total FROM commentaires WHERE user_id = ?';
  const [countResult] = await db.query(countSql, [userId]);

  return {
    commentaires,
    pagination: {
      limit,
      offset,
      total: countResult[0].total
    }
  };
};

/**
 * Mettre à jour un commentaire
 * @param {number} commentaireId - L'ID du commentaire
 * @param {number} userId - L'ID de l'utilisateur (pour vérification)
 * @param {string} contenu - Le nouveau contenu
 * @returns {Object} Le commentaire mis à jour
 */
exports.updateCommentaire = async (commentaireId, userId, contenu) => {
  const sql = `
    UPDATE commentaires 
    SET contenu = ?
    WHERE id = ? AND user_id = ?
  `;
  const [result] = await db.query(sql, [contenu, commentaireId, userId]);
  
  if (result.affectedRows === 0) {
    throw new Error('Commentaire non trouvé ou utilisateur non autorisé');
  }
  
  return await this.getCommentaireById(commentaireId);
};

/**
 * Supprimer un commentaire
 * @param {number} commentaireId - L'ID du commentaire
 * @param {number} userId - L'ID de l'utilisateur (pour vérification)
 * @returns {boolean} True si supprimé avec succès
 */
exports.deleteCommentaire = async (commentaireId, userId) => {
  const sql = 'DELETE FROM commentaires WHERE id = ? AND user_id = ?';
  const [result] = await db.query(sql, [commentaireId, userId]);
  return result.affectedRows > 0;
};

/**
 * Obtenir le nombre de commentaires pour une critique
 * @param {number} critiqueId - L'ID de la critique
 * @returns {number} Le nombre de commentaires
 */
exports.getCommentaireCount = async (critiqueId) => {
  const sql = 'SELECT COUNT(*) as total FROM commentaires WHERE critique_id = ?';
  const [rows] = await db.query(sql, [critiqueId]);
  return rows[0].total;
};
