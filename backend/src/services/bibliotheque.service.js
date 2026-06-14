const db = require('../../config/db');

class BibliothequeService {

  // ===== CRUD Bibliothèque Items =====

  async addToBibliotheque(userId, oeuvreId, statutOrId = 'A_VOIR') {
    // Try to insert using the modern 'statut' text column first; if DB doesn't have it, fall back to 'statut_id'.
    const tryInsertStatutText = async () => {
      const query = `
        INSERT INTO bibliotheque_items (user_id, oeuvre_id, statut, updated_at)
        VALUES (?, ?, ?, NOW())
      `;
      return db.execute(query, [userId, oeuvreId, statutOrId]);
    };

    const tryInsertStatutId = async () => {
      const query = `
        INSERT INTO bibliotheque_items (user_id, oeuvre_id, statut_id, updated_at)
        VALUES (?, ?, ?, NOW())
      `;
      // ensure numeric value for statut_id when possible
      const parsed = (typeof statutOrId === 'number') ? statutOrId : parseInt(String(statutOrId), 10);
      return db.execute(query, [userId, oeuvreId, Number.isNaN(parsed) ? null : parsed]);
    };

    try {
      const [result] = await tryInsertStatutText();
      return result.insertId;
    } catch (err) {
      // ER_BAD_FIELD_ERROR when column doesn't exist -> fallback
      if (err && err.code === 'ER_BAD_FIELD_ERROR') {
        const [result] = await tryInsertStatutId();
        return result.insertId;
      }
      throw err;
    }
  }

  async updateBibliothequeItem(userId, itemId, updates) {
    // Accept either 'statut' or 'statut_id' from clients; attempt update with available column names, fallback on missing-column error.
    const buildAndExecute = async (allowedFields) => {
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
    };

    // Try with 'statut' (new) first, then fall back to 'statut_id'
    try {
      return await buildAndExecute(['statut']);
    } catch (err) {
      if (err && err.code === 'ER_BAD_FIELD_ERROR') {
        // try 'statut_id'
        // normalize value: if updates.statut present, attempt to use it for statut_id as-is
        if (updates.statut !== undefined && updates.statut_id === undefined) {
          updates.statut_id = updates.statut;
        }
        return await buildAndExecute(['statut_id']);
      }
      throw err;
    }
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
    // Best-effort: try to query using the modern 'statut' column; if that column is missing, fall back to 'statut_id'.
    const buildQueryStatut = () => (`
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
    `);

    const buildQueryStatutId = () => (`
      SELECT
        bi.id,
        bi.user_id,
        bi.oeuvre_id,
        bi.statut_id,
        bi.updated_at,
        o.titre,
        o.description,
        o.api_reference_id
      FROM bibliotheque_items bi
      JOIN oeuvres o ON bi.oeuvre_id = o.id
      WHERE bi.user_id = ?
    `);

    const params = [userId];

    // prefer 'statut' filter if provided
    const tryStatut = async () => {
      let query = buildQueryStatut();
      if (filters.statut) {
        query += ' AND bi.statut = ?';
        params.push(filters.statut);
      }
      query += ' ORDER BY bi.updated_at DESC';
      const [rows] = await db.execute(query, params);
      return rows;
    };

    try {
      return await tryStatut();
    } catch (err) {
      if (err && err.code === 'ER_BAD_FIELD_ERROR') {
        // fallback to statut_id queries
        const paramsId = [userId];
        let query = buildQueryStatutId();
        if (filters.statut_id || filters.statut) {
          // allow both filters
          const value = (filters.statut_id !== undefined) ? filters.statut_id : filters.statut;
          query += ' AND bi.statut_id = ?';
          paramsId.push(value);
        }
        query += ' ORDER BY bi.updated_at DESC';
        const [rows] = await db.execute(query, paramsId);
        // normalize result field to 'statut' object if possible is left to upstream code
        return rows;
      }
      throw err;
    }
  }
}

module.exports = new BibliothequeService();
