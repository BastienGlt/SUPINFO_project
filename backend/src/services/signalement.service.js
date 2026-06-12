const db = require('../../config/db');

const TYPES_CONTENU_VALIDES = ['profil', 'commentaire', 'critique'];

exports.createSignalement = async (signaleurId, typeContenu, contenuId, motif) => {
  if (!TYPES_CONTENU_VALIDES.includes(typeContenu)) {
    throw new Error('Type de contenu invalide');
  }

  const sql = `
    INSERT INTO signalements (signaleur_id, type_contenu, contenu_id, motif, statut, created_at)
    VALUES (?, ?, ?, ?, 'en_attente', NOW())
  `;
  const [result] = await db.query(sql, [signaleurId, typeContenu, contenuId, motif]);

  const [rows] = await db.query('SELECT * FROM v_signalements WHERE id = ?', [result.insertId]);
  return rows[0];
};
