const db = require('../../config/db');
const notificationService = require('./notification.service');

/**
 * Service : Logique métier pour le système de follow/unfollow
 * Gère les relations d'abonnement entre utilisateurs
 */

/**
 * Suivre un utilisateur
 * @param {number} followerId - L'ID de l'utilisateur qui suit (user_sub)
 * @param {number} followedId - L'ID de l'utilisateur suivi (user_follow)
 * @returns {Object} Résultat de l'opération
 */
exports.followUser = async (followerId, followedId) => {
  const sql = `
    INSERT INTO followers (user_sub, user_follow, created_at)
    VALUES (?, ?, NOW())
  `;
  await db.query(sql, [followerId, followedId]);

  // Notifier l'utilisateur suivi (fire-and-forget, ne bloque pas la réponse)
  notificationService.createNotification(followedId, followerId, 'follow', followerId).catch(console.error);

  return { success: true, message: 'Utilisateur suivi avec succès' };
};

/**
 * Ne plus suivre un utilisateur
 * @param {number} followerId - L'ID de l'utilisateur qui suit (user_sub)
 * @param {number} followedId - L'ID de l'utilisateur suivi (user_follow)
 * @returns {boolean} True si l'unfollow a réussi
 */
exports.unfollowUser = async (followerId, followedId) => {
  const sql = 'DELETE FROM followers WHERE user_sub = ? AND user_follow = ?';
  const [result] = await db.query(sql, [followerId, followedId]);
  return result.affectedRows > 0;
};

/**
 * Vérifie si un utilisateur en suit un autre
 * @param {number} followerId - L'ID de l'utilisateur qui suit
 * @param {number} followedId - L'ID de l'utilisateur suivi
 * @returns {boolean} True si l'utilisateur suit l'autre
 */
exports.isFollowing = async (followerId, followedId) => {
  const sql = 'SELECT 1 FROM followers WHERE user_sub = ? AND user_follow = ?';
  const [rows] = await db.query(sql, [followerId, followedId]);
  return rows.length > 0;
};

/**
 * Récupère la liste des abonnés d'un utilisateur
 * @param {number} userId - L'ID de l'utilisateur
 * @returns {Array} Liste des abonnés avec leurs informations
 */
exports.getFollowers = async (userId) => {
  const sql = `
    SELECT *
    FROM v_followers
    WHERE followed_id = ?
    ORDER BY followed_at DESC
  `;
  const [rows] = await db.query(sql, [userId]);
  return rows;
};

/**
 * Récupère la liste des abonnements d'un utilisateur
 * @param {number} userId - L'ID de l'utilisateur
 * @returns {Array} Liste des utilisateurs suivis avec leurs informations
 */
exports.getFollowing = async (userId) => {
  const sql = `
    SELECT *
    FROM v_followers
    WHERE follower_id = ?
    ORDER BY followed_at DESC
  `;
  const [rows] = await db.query(sql, [userId]);
  return rows;
};

/**
 * Récupère les statistiques de suivi d'un utilisateur
 * @param {number} userId - L'ID de l'utilisateur
 * @returns {Object} Nombre d'abonnés et d'abonnements
 */
exports.getFollowStats = async (userId) => {
  const sqlFollowers = 'SELECT COUNT(*) as count FROM followers WHERE user_follow = ?';
  const sqlFollowing = 'SELECT COUNT(*) as count FROM followers WHERE user_sub = ?';
  
  const [followersResult] = await db.query(sqlFollowers, [userId]);
  const [followingResult] = await db.query(sqlFollowing, [userId]);
  
  return {
    followers: followersResult[0].count,
    following: followingResult[0].count
  };
};