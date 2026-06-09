const db = require('../../config/db');

/**
 * Cherche une oeuvre par son api_reference_id.
 * @param {string} apiReferenceId
 * @returns {Object|null}
 */
exports.findByApiRef = async (apiReferenceId) => {
  const [rows] = await db.query(
    'SELECT * FROM oeuvres WHERE api_reference_id = ?',
    [String(apiReferenceId)]
  );
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Trouve ou crée une oeuvre à partir de sa référence API externe.
 * Si elle n'existe pas encore en base, elle est insérée avec le titre et la description fournis.
 * @param {string} apiReferenceId - Identifiant dans l'API externe (ex: RAWG, IGDB…)
 * @param {string} titre
 * @param {string} description
 * @returns {Object} L'oeuvre (existante ou nouvellement créée)
 */
exports.getNoteMoyenneByApiRef = async (apiReferenceId) => {
  const [rows] = await db.query(
    'SELECT * FROM v_oeuvres_notes_moyennes WHERE api_reference_id = ?',
    [String(apiReferenceId)]
  );
  return rows.length > 0 ? rows[0] : null;
};

exports.getAllNotesMoyennes = async ({ limit = 20, offset = 0 } = {}) => {
  const [rows] = await db.query(
    'SELECT * FROM v_oeuvres_notes_moyennes ORDER BY note_moyenne DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
  const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM v_oeuvres_notes_moyennes');
  return { oeuvres: rows, pagination: { limit, offset, total } };
};

exports.findOrCreate = async (apiReferenceId, titre, description) => {
  const existing = await exports.findByApiRef(apiReferenceId);
  if (existing) return existing;

  const [result] = await db.query(
    'INSERT INTO oeuvres (api_reference_id, titre, description) VALUES (?, ?, ?)',
    [String(apiReferenceId), titre, description]
  );

  return {
    id: result.insertId,
    api_reference_id: String(apiReferenceId),
    titre,
    description
  };
};
