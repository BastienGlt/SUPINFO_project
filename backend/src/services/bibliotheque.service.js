const db = require('../../config/db');

class BibliothequeService {

  // ===== CRUD Bibliothèque Items =====

  async addToBibliotheque(userId, oeuvreId, statut = 'A_VOIR') {
    const query = `
      INSERT INTO bibliotheque_items (user_id, oeuvre_id, statut, updated_at)
      VALUES (?, ?, ?, NOW())
    `;
    const [result] = await db.execute(query, [userId, oeuvreId, statut]);
    return result.insertId;
  }

  async updateBibliothequeItem(userId, itemId, updates) {
    const allowedFields = ['statut'];
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('Aucun champ valide à mettre à jour');
    }

    fields.push('updated_at = NOW()');
    values.push(userId, itemId);

    const query = `
      UPDATE bibliotheque_items
      SET ${fields.join(', ')}
      WHERE user_id = ? AND id = ?
    `;

    const [result] = await db.execute(query, values);
    return result.affectedRows > 0;
  }

  async removeFromBibliotheque(userId, itemId) {
    const query = 'DELETE FROM bibliotheque_items WHERE user_id = ? AND id = ?';
    const [result] = await db.execute(query, [userId, itemId]);
    return result.affectedRows > 0;
  }

  async getStats(userId) {
    const [[global]] = await db.execute(
      'SELECT total, oeuvres_uniques, derniere_mise_a_jour FROM v_bibliotheque_stats WHERE user_id = ?',
      [userId]
    );

    const [parStatut] = await db.execute(
      'SELECT statut, `count` FROM v_bibliotheque_stats_par_statut WHERE user_id = ?',
      [userId]
    );

    const stats = global || { total: 0, oeuvres_uniques: 0, derniere_mise_a_jour: null };
    stats.par_statut = {};
    parStatut.forEach(row => {
      stats.par_statut[row.statut] = row.count;
    });

    return stats;
  }

  async getUserBibliotheque(userId, filters = {}) {
    let query = `
      SELECT
        bi.id,
        bi.user_id,
        bi.oeuvre_id,
        bi.statut,
        bi.updated_at,
        o.titre,
        o.description,
        o.api_reference_id
      FROM bibliotheque_items bi
      JOIN oeuvres o ON bi.oeuvre_id = o.id
      WHERE bi.user_id = ?
    `;

    const params = [userId];

    if (filters.statut) {
      query += ' AND bi.statut = ?';
      params.push(filters.statut);
    }

    query += ' ORDER BY bi.updated_at DESC';

    const [rows] = await db.execute(query, params);
    return rows;
  }
}

module.exports = new BibliothequeService();
