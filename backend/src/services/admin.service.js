const db = require('../../config/db');

/**
 * Service : Actions d'administration et de modération
 *
 * Fonctionnalités admin (role_id = 3) :
 *  - Bannissement / débannissement d'un utilisateur
 *  - Mise en avant / retrait d'une critique
 *  - Listes des critiques en avant / utilisateurs bannis
 *
 * Fonctionnalités modérateur (role_id >= 2) :
 *  - Suppression d'une critique (n'importe laquelle)
 *  - Masquage / affichage d'une critique
 *  - Suppression d'un commentaire (n'importe lequel)
 *  - Avertissement / retrait d'avertissement d'un utilisateur
 *  - Listes des critiques masquées / utilisateurs avertis
 */

// ==================== CRITIQUES ====================

/**
 * Récupère toutes les critiques — modérateur+.
 * @returns {Array}
 */
exports.getAllCritiques = async () => {
  const [rows] = await db.query(
    'SELECT * FROM v_critiques_complete ORDER BY created_at DESC'
  );
  return rows;
};

/**
 * Récupère une critique par son ID.
 * @param {number} critiqueId
 * @returns {Object|null}
 */
exports.getCritiqueById = async (critiqueId) => {
  const [rows] = await db.query('SELECT * FROM critiques WHERE id = ?', [critiqueId]);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Supprime une critique sans vérification d'ownership (modérateur+).
 * @param {number} critiqueId
 * @returns {boolean}
 */
exports.deleteCritique = async (critiqueId) => {
  const [result] = await db.query('DELETE FROM critiques WHERE id = ?', [critiqueId]);
  return result.affectedRows > 0;
};

/**
 * Masque une critique (hidden = true) — modérateur+.
 * La critique reste en base mais n'est plus visible publiquement.
 * @param {number} critiqueId
 * @returns {boolean}
 */
exports.hideCritique = async (critiqueId) => {
  const [result] = await db.query(
    'UPDATE critiques SET hidden = TRUE WHERE id = ?',
    [critiqueId]
  );
  return result.affectedRows > 0;
};

/**
 * Rend une critique de nouveau visible (hidden = false) — modérateur+.
 * @param {number} critiqueId
 * @returns {boolean}
 */
exports.unhideCritique = async (critiqueId) => {
  const [result] = await db.query(
    'UPDATE critiques SET hidden = FALSE WHERE id = ?',
    [critiqueId]
  );
  return result.affectedRows > 0;
};

/**
 * Récupère toutes les critiques masquées — modérateur+.
 * @returns {Array}
 */
exports.getHiddenCritiques = async () => {
  const [rows] = await db.query(
    'SELECT v.* FROM v_critiques_complete v JOIN critiques c ON c.id = v.id WHERE c.hidden = TRUE ORDER BY v.updated_at DESC'
  );
  return rows;
};

/**
 * Met une critique en avant (featured = true) — admin uniquement.
 * @param {number} critiqueId
 * @returns {boolean}
 */
exports.featureCritique = async (critiqueId) => {
  const [result] = await db.query(
    'UPDATE critiques SET featured = TRUE WHERE id = ?',
    [critiqueId]
  );
  return result.affectedRows > 0;
};

/**
 * Retire une critique de la mise en avant (featured = false) — admin uniquement.
 * @param {number} critiqueId
 * @returns {boolean}
 */
exports.unfeatureCritique = async (critiqueId) => {
  const [result] = await db.query(
    'UPDATE critiques SET featured = FALSE WHERE id = ?',
    [critiqueId]
  );
  return result.affectedRows > 0;
};

/**
 * Récupère toutes les critiques mises en avant — admin uniquement.
 * @returns {Array}
 */
exports.getFeaturedCritiques = async () => {
  const [rows] = await db.query(
    'SELECT v.* FROM v_critiques_complete v JOIN critiques c ON c.id = v.id WHERE c.featured = TRUE ORDER BY v.created_at DESC'
  );
  return rows;
};

// ==================== COMMENTAIRES ====================

/**
 * Récupère un commentaire par son ID.
 * @param {number} commentaireId
 * @returns {Object|null}
 */
exports.getCommentaireById = async (commentaireId) => {
  const [rows] = await db.query('SELECT * FROM commentaires WHERE id = ?', [commentaireId]);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Supprime n'importe quel commentaire sans vérification d'ownership — modérateur+.
 * @param {number} commentaireId
 * @returns {boolean}
 */
exports.deleteCommentaire = async (commentaireId) => {
  const [result] = await db.query('DELETE FROM commentaires WHERE id = ?', [commentaireId]);
  return result.affectedRows > 0;
};

// ==================== UTILISATEURS ====================

/**
 * Bannit un utilisateur (status = 'banned') — admin uniquement.
 * @param {number} userId
 * @returns {boolean}
 */
exports.banUser = async (userId) => {
  const [result] = await db.query(
    "UPDATE users SET status = 'banned', updated_at = NOW() WHERE id = ?",
    [userId]
  );
  return result.affectedRows > 0;
};

/**
 * Débannit un utilisateur (status = 'active') — admin uniquement.
 * @param {number} userId
 * @returns {boolean}
 */
exports.unbanUser = async (userId) => {
  const [result] = await db.query(
    "UPDATE users SET status = 'active', updated_at = NOW() WHERE id = ?",
    [userId]
  );
  return result.affectedRows > 0;
};

/**
 * Émet un avertissement à un utilisateur (status = 'warned') — modérateur+.
 * @param {number} userId
 * @returns {boolean}
 */
exports.warnUser = async (userId) => {
  const [result] = await db.query(
    "UPDATE users SET status = 'warned', updated_at = NOW() WHERE id = ?",
    [userId]
  );
  return result.affectedRows > 0;
};

/**
 * Retire l'avertissement d'un utilisateur (status = 'active') — modérateur+.
 * @param {number} userId
 * @returns {boolean}
 */
exports.unwarnUser = async (userId) => {
  const [result] = await db.query(
    "UPDATE users SET status = 'active', updated_at = NOW() WHERE id = ?",
    [userId]
  );
  return result.affectedRows > 0;
};

/**
 * Récupère tous les utilisateurs — modérateur+.
 * @returns {Array}
 */
exports.getAllUsers = async () => {
  const [rows] = await db.query(
    'SELECT id, pseudo, email, prenom, nom, photo, role_id, status, created_at, updated_at FROM users ORDER BY created_at DESC'
  );
  return rows;
};

/**
 * Récupère tous les utilisateurs bannis — admin uniquement.
 * @returns {Array}
 */
exports.getBannedUsers = async () => {
  const [rows] = await db.query(
    "SELECT id, pseudo, email, prenom, nom, photo, status, created_at, updated_at FROM users WHERE status = 'banned' ORDER BY updated_at DESC"
  );
  return rows;
};

/**
 * Récupère tous les utilisateurs avertis — modérateur+.
 * @returns {Array}
 */
exports.getWarnedUsers = async () => {
  const [rows] = await db.query(
    "SELECT id, pseudo, email, prenom, nom, photo, status, created_at, updated_at FROM users WHERE status = 'warned' ORDER BY updated_at DESC"
  );
  return rows;
};

// ==================== SIGNALEMENTS ====================

/**
 * Récupère tous les signalements — modérateur+.
 * @param {Object} filters - { statut, type_contenu }
 * @returns {Array}
 */
exports.getAllSignalements = async (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.statut) {
    conditions.push('s.statut = ?');
    values.push(filters.statut);
  }
  if (filters.type_contenu) {
    conditions.push('s.type_contenu = ?');
    values.push(filters.type_contenu);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.query(
    `SELECT * FROM v_signalements s ${where} ORDER BY s.created_at DESC`,
    values
  );
  return rows;
};

/**
 * Récupère un signalement par son ID — modérateur+.
 * @param {number} signalementId
 * @returns {Object|null}
 */
exports.getSignalementById = async (signalementId) => {
  const [rows] = await db.query('SELECT * FROM v_signalements WHERE id = ?', [signalementId]);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Met à jour le statut d'un signalement — modérateur+.
 * @param {number} signalementId
 * @param {string} statut - 'en_attente' | 'traite' | 'rejete'
 * @returns {boolean}
 */
exports.updateSignalementStatut = async (signalementId, statut) => {
  const [result] = await db.query(
    'UPDATE signalements SET statut = ? WHERE id = ?',
    [statut, signalementId]
  );
  return result.affectedRows > 0;
};

/**
 * Supprime un signalement — modérateur+.
 * @param {number} signalementId
 * @returns {boolean}
 */
exports.deleteSignalement = async (signalementId) => {
  const [result] = await db.query('DELETE FROM signalements WHERE id = ?', [signalementId]);
  return result.affectedRows > 0;
};

// ==================== STATUTS ====================

/**
 * Récupère tous les statuts — admin uniquement.
 * @returns {Array}
 */
exports.getAllStatuts = async () => {
  const [rows] = await db.query('SELECT * FROM statuts ORDER BY id ASC');
  return rows;
};

/**
 * Récupère un statut par son ID — admin uniquement.
 * @param {number} statutId
 * @returns {Object|null}
 */
exports.getStatutById = async (statutId) => {
  const [rows] = await db.query('SELECT * FROM statuts WHERE id = ?', [statutId]);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Crée un nouveau statut — admin uniquement.
 * @param {string} code
 * @param {string} libele
 * @returns {number} ID du statut créé
 */
exports.createStatut = async (code, libele) => {
  const [result] = await db.query(
    'INSERT INTO statuts (code, libele) VALUES (?, ?)',
    [code, libele]
  );
  return result.insertId;
};

/**
 * Met à jour un statut — admin uniquement.
 * @param {number} statutId
 * @param {string|undefined} code
 * @param {string|undefined} libele
 * @returns {boolean}
 */
exports.updateStatut = async (statutId, code, libele) => {
  const fields = [];
  const values = [];
  if (code !== undefined) { fields.push('code = ?'); values.push(code); }
  if (libele !== undefined) { fields.push('libele = ?'); values.push(libele); }
  if (fields.length === 0) return false;
  values.push(statutId);
  const [result] = await db.query(
    `UPDATE statuts SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

/**
 * Supprime un statut — admin uniquement.
 * Refuse la suppression si des items de bibliothèque utilisent ce statut.
 * @param {number} statutId
 * @returns {{ deleted: boolean, inUse: boolean }}
 */
exports.deleteStatut = async (statutId) => {
  const [usages] = await db.query(
    'SELECT COUNT(*) AS cnt FROM bibliotheque_items WHERE statut_id = ?',
    [statutId]
  );
  if (usages[0].cnt > 0) return { deleted: false, inUse: true };
  const [result] = await db.query('DELETE FROM statuts WHERE id = ?', [statutId]);
  return { deleted: result.affectedRows > 0, inUse: false };
};
