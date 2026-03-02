const db = require('../../config/db');

class ListeService {

  // ===== CRUD Listes =====

  async createListe(userId, data) {
    const { nom, description, visibilite = 'PUBLIQUE' } = data;

    const query = `
      INSERT INTO listes (user_id, nom, description, visibilite, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    const [result] = await db.execute(query, [userId, nom, description, visibilite]);
    return result.insertId;
  }

  async updateListe(userId, listeId, updates) {
    const allowedFields = ['nom', 'description', 'visibilite'];
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

    values.push(userId, listeId);

    const query = `
      UPDATE listes
      SET ${fields.join(', ')}
      WHERE user_id = ? AND id = ?
    `;

    const [result] = await db.execute(query, values);
    return result.affectedRows > 0;
  }

  async deleteListe(userId, listeId) {
    const query = 'DELETE FROM listes WHERE user_id = ? AND id = ?';
    const [result] = await db.execute(query, [userId, listeId]);
    return result.affectedRows > 0;
  }

  async getUserListes(userId, requestUserId = null) {
    let visibiliteClause = '';

    if (parseInt(requestUserId) !== parseInt(userId)) {
      // Consultation d'un autre utilisateur : seulement les listes publiques
      visibiliteClause = `AND l.visibilite = 'PUBLIQUE'`;
    }

    const query = `
      SELECT
        l.id,
        l.user_id,
        l.nom,
        l.description,
        l.visibilite,
        l.created_at,
        COUNT(lo.oeuvre_id) as nombre_oeuvres
      FROM listes l
      LEFT JOIN liste_oeuvres lo ON l.id = lo.liste_id
      WHERE l.user_id = ? ${visibiliteClause}
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `;

    const [rows] = await db.execute(query, [userId]);
    return rows;
  }

  async getListe(listeId, requestUserId = null) {
    const query = `
      SELECT
        l.id,
        l.user_id,
        l.nom,
        l.description,
        l.visibilite,
        l.created_at,
        u.pseudo as createur_pseudo,
        u.photo as createur_photo,
        COUNT(lo.oeuvre_id) as nombre_oeuvres
      FROM listes l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN liste_oeuvres lo ON l.id = lo.liste_id
      WHERE l.id = ?
      GROUP BY l.id
    `;

    const [rows] = await db.execute(query, [listeId]);

    if (rows.length === 0) {
      return null;
    }

    const liste = rows[0];

    // Vérifier les permissions de visibilité
    if (liste.visibilite === 'PRIVEE' && liste.user_id !== requestUserId) {
      return null;
    }

    if (liste.visibilite === 'AMIS' && requestUserId) {
      const isFriend = await this.checkIfFriends(liste.user_id, requestUserId);
      if (!isFriend && liste.user_id !== requestUserId) {
        return null;
      }
    }

    return liste;
  }

  async getListeOeuvres(listeId, requestUserId = null) {
    // Vérifier d'abord les permissions
    const liste = await this.getListe(listeId, requestUserId);
    if (!liste) {
      return null;
    }

    const query = `
      SELECT
        lo.liste_id,
        lo.oeuvre_id,
        lo.added_at,
        o.titre,
        o.description,
        o.api_reference_id
      FROM liste_oeuvres lo
      JOIN oeuvres o ON lo.oeuvre_id = o.id
      WHERE lo.liste_id = ?
      ORDER BY lo.added_at DESC
    `;

    const [rows] = await db.execute(query, [listeId]);
    return rows;
  }

  // ===== Gestion des œuvres dans les listes =====

  async addOeuvreToListe(userId, listeId, oeuvreId) {
    // Vérifier que la liste appartient à l'utilisateur
    const [listes] = await db.execute('SELECT id FROM listes WHERE id = ? AND user_id = ?', [listeId, userId]);

    if (listes.length === 0) {
      throw new Error('Liste non trouvée ou accès refusé');
    }

    const query = `
      INSERT INTO liste_oeuvres (liste_id, oeuvre_id, added_at)
      VALUES (?, ?, NOW())
    `;

    await db.execute(query, [listeId, oeuvreId]);
    return true;
  }

  async removeOeuvreFromListe(userId, listeId, oeuvreId) {
    // Vérifier que la liste appartient à l'utilisateur
    const [listes] = await db.execute('SELECT id FROM listes WHERE id = ? AND user_id = ?', [listeId, userId]);

    if (listes.length === 0) {
      throw new Error('Liste non trouvée ou accès refusé');
    }

    const query = 'DELETE FROM liste_oeuvres WHERE liste_id = ? AND oeuvre_id = ?';
    const [result] = await db.execute(query, [listeId, oeuvreId]);
    return result.affectedRows > 0;
  }

  // ===== Listes publiques (découverte) =====

  async getPublicListes(limit = 20, offset = 0) {
    const query = `
      SELECT
        l.id,
        l.user_id,
        l.nom,
        l.description,
        l.visibilite,
        l.created_at,
        u.pseudo as createur_pseudo,
        u.photo as createur_photo,
        COUNT(lo.oeuvre_id) as nombre_oeuvres
      FROM listes l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN liste_oeuvres lo ON l.id = lo.liste_id
      WHERE l.visibilite = 'PUBLIQUE'
      GROUP BY l.id
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.execute(query, [limit, offset]);
    return rows;
  }

  // ===== Utilitaires =====

  async checkIfFriends(userId1, userId2) {
    const query = `
      SELECT 1 FROM followers
      WHERE (user_sub = ? AND user_follow = ?)
         OR (user_sub = ? AND user_follow = ?)
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [userId1, userId2, userId2, userId1]);
    return rows.length > 0;
  }
}

module.exports = new ListeService();
