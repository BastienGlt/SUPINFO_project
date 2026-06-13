const db = require('../../config/db');
const sse = require('../utils/sse');

/**
 * Service : Logique métier pour le système de notifications
 *
 * Types supportés :
 *  - 'like'      : un utilisateur a liké une critique (source_id = critique_id)
 *  - 'commentaire': un utilisateur a commenté une critique (source_id = critique_id)
 *  - 'follow'    : un utilisateur a commencé à vous suivre (source_id = from_user_id)
 */

/**
 * Crée une notification en base et la pousse en temps réel via SSE.
 * Ne lève pas d'erreur si le destinataire = l'émetteur (on ne se notifie pas soi-même).
 *
 * @param {number} userId       - ID du destinataire
 * @param {number} fromUserId   - ID de l'utilisateur qui a déclenché l'action
 * @param {string} type         - 'like' | 'commentaire' | 'follow'
 * @param {number} sourceId     - ID de la ressource liée (critique_id ou from_user_id)
 */
exports.createNotification = async (userId, fromUserId, type, sourceId) => {
  // Ne pas notifier soi-même
  if (userId === fromUserId) return;

  const sql = `
    INSERT INTO notifications (user_id, from_user_id, type, source_id, lu, created_at)
    VALUES (?, ?, ?, ?, false, NOW())
  `;
  const [result] = await db.query(sql, [userId, fromUserId, type, sourceId]);

  // Récupérer la notification complète pour l'envoyer en SSE
  const notif = await exports.getNotificationById(result.insertId);
  if (notif) {
    sse.sendToUser(userId, 'notification', notif);
  }
};

/**
 * Récupère une notification par son ID (avec infos de l'émetteur).
 * @param {number} notifId
 * @returns {Object|null}
 */
exports.getNotificationById = async (notifId) => {
  const sql = 'SELECT * FROM v_notifications WHERE id = ?';
  const [rows] = await db.query(sql, [notifId]);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Récupère toutes les notifications d'un utilisateur, les plus récentes en premier.
 * @param {number} userId
 * @param {Object} options - { limit, offset }
 * @returns {Object} { notifications, unreadCount, pagination }
 */
exports.getNotifications = async (userId, options = {}) => {
  const { limit = 30, offset = 0 } = options;

  const sql = `
    SELECT * FROM v_notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [notifications] = await db.query(sql, [userId, limit, offset]);

  const countSql = 'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?';
  const [countResult] = await db.query(countSql, [userId]);

  const unreadCount = await exports.countUnread(userId);

  return {
    notifications,
    unreadCount,
    pagination: {
      limit,
      offset,
      total: countResult[0].total
    }
  };
};

/**
 * Marque une notification comme lue.
 * Vérifie que la notification appartient bien à l'utilisateur.
 * @param {number} notifId
 * @param {number} userId
 * @returns {boolean} True si mis à jour
 */
exports.markAsRead = async (notifId, userId) => {
  const sql = 'UPDATE notifications SET lu = true WHERE id = ? AND user_id = ?';
  const [result] = await db.query(sql, [notifId, userId]);
  return result.affectedRows > 0;
};

/**
 * Marque toutes les notifications d'un utilisateur comme lues.
 * @param {number} userId
 * @returns {number} Nombre de notifications mises à jour
 */
exports.markAllAsRead = async (userId) => {
  const sql = 'UPDATE notifications SET lu = true WHERE user_id = ? AND lu = false';
  const [result] = await db.query(sql, [userId]);
  return result.affectedRows;
};

/**
 * Compte les notifications non lues d'un utilisateur.
 * @param {number} userId
 * @returns {number}
 */
exports.countUnread = async (userId) => {
  const sql = 'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND lu = false';
  const [rows] = await db.query(sql, [userId]);
  return rows[0].count;
};
