const db = require('../../config/db');

/**
 * Service : Signalements de contenu
 *
 * Actions utilisateur (role_id >= 1) :
 *  - Signaler un contenu (critique, commentaire, liste)
 *  - Voir ses propres signalements
 *
 * Actions modérateur (role_id >= 2) :
 *  - Voir tous les signalements (filtrables par statut)
 *  - Mettre à jour le statut d'un signalement ('traité' | 'rejeté')
 *  - Supprimer un signalement
 */

// ==================== LECTURE ====================

/**
 * Récupère un signalement par son ID.
 * @param {number} id
 * @returns {Object|null}
 */
exports.getSignalementById = async (id) => {
  const [rows] = await db.query('SELECT * FROM v_signalements WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Récupère tous les signalements, filtrable par statut — modérateur+.
 * @param {string|null} statut - 'en_attente' | 'traité' | 'rejeté' | null (tous)
 * @returns {Array}
 */
exports.getAllSignalements = async (statut = null) => {
  if (statut) {
    const [rows] = await db.query(
      'SELECT * FROM v_signalements WHERE statut = ? ORDER BY created_at DESC',
      [statut]
    );
    return rows;
  }
  const [rows] = await db.query(
    'SELECT * FROM v_signalements ORDER BY created_at DESC'
  );
  return rows;
};

/**
 * Récupère les signalements envoyés par un utilisateur spécifique.
 * @param {number} userId
 * @returns {Array}
 */
exports.getSignalementsByUser = async (userId) => {
  const [rows] = await db.query(
    'SELECT * FROM v_signalements WHERE signaleur_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
};

// ==================== CRÉATION ====================

/**
 * Crée un nouveau signalement.
 * @param {number} signaleurId
 * @param {string} typeContenu - 'critique' | 'commentaire' | 'liste'
 * @param {number} contenuId
 * @param {string} motif
 * @returns {number} ID du signalement créé
 */
exports.createSignalement = async (signaleurId, typeContenu, contenuId, motif) => {
  const [result] = await db.query(
    `INSERT INTO signalements (signaleur_id, type_contenu, contenu_id, motif, statut, created_at)
     VALUES (?, ?, ?, ?, 'en_attente', NOW())`,
    [signaleurId, typeContenu, contenuId, motif]
  );
  return result.insertId;
};

// ==================== MISE À JOUR ====================

/**
 * Met à jour le statut d'un signalement — modérateur+.
 * @param {number} id
 * @param {string} statut - 'traité' | 'rejeté'
 * @returns {boolean}
 */
exports.updateStatut = async (id, statut) => {
  const [result] = await db.query(
    'UPDATE signalements SET statut = ? WHERE id = ?',
    [statut, id]
  );
  return result.affectedRows > 0;
};

// ==================== SUPPRESSION ====================

/**
 * Supprime un signalement — modérateur+.
 * @param {number} id
 * @returns {boolean}
 */
exports.deleteSignalement = async (id) => {
  const [result] = await db.query('DELETE FROM signalements WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
