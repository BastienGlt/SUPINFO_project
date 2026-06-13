const db = require('../../config/db');

/**
 * Service : Fil d'actualité chronologique
 *
 * Agrège les activités des utilisateurs suivis par l'utilisateur connecté :
 *  - Nouvelles critiques publiées
 *  - Nouveaux commentaires postés
 *  - Nouvelles listes publiques créées
 *
 * Chaque entrée du feed porte un champ `type` ('critique' | 'commentaire' | 'liste')
 * pour que le frontend puisse l'afficher différemment.
 */

/**
 * Récupère le fil d'actualité chronologique de l'utilisateur.
 * @param {number} userId - ID de l'utilisateur connecté
 * @param {Object} options - { limit, offset }
 * @returns {Object} { feed, pagination }
 */
exports.getFeed = async (userId, options = {}) => {
  const { limit = 20, offset = 0 } = options;

  const sql = `
    SELECT * FROM v_feed_activities
    WHERE author_id IN (SELECT user_follow FROM followers WHERE user_sub = ?)
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [feed] = await db.query(sql, [userId, limit, offset]);

  const countSql = `
    SELECT COUNT(*) AS total FROM v_feed_activities
    WHERE author_id IN (SELECT user_follow FROM followers WHERE user_sub = ?)
  `;
  const [countResult] = await db.query(countSql, [userId]);

  return {
    feed,
    pagination: {
      limit,
      offset,
      total: countResult[0].total
    }
  };
};

/**
 * Récupère les derniers avis (critiques) publiés par n'importe quel utilisateur,
 * sur n'importe quelle oeuvre présente en base.
 * @param {number} limit - Nombre d'avis à retourner
 * @returns {Object} { feed }
 */
exports.getLatestReviews = async (limit = 5) => {
  const sql = `
    SELECT * FROM v_feed_activities
    WHERE type = 'critique' COLLATE utf8mb4_general_ci
    ORDER BY created_at DESC
    LIMIT ?
  `;
  const [feed] = await db.query(sql, [limit]);

  return { feed };
};
