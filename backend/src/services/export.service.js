const db = require('../../config/db');

/**
 * Service : Export des données personnelles
 *
 * Agrège l'ensemble des données liées à un utilisateur pour
 * les exporter au format JSON ou CSV (RGPD / droit d'accès).
 */

// ==================== COLLECTE DES DONNÉES ====================

/**
 * Récupère toutes les données personnelles d'un utilisateur.
 * @param {number} userId
 * @returns {Object} Données structurées par catégorie
 */
exports.getUserExportData = async (userId) => {
  const [
    profileRows,
    critiquesRows,
    commentairesRows,
    listesRows,
    bibliothequeRows,
    followingRows,
    followersRows,
    signalementRows,
  ] = await Promise.all([
    // Profil
    db.query(
      `SELECT id, prenom, nom, pseudo, email, bio, photo, status, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    ),
    // Critiques rédigées
    db.query(
      `SELECT c.id, o.titre AS oeuvre, o.api_reference_id, c.note, c.contenu,
              c.featured, c.hidden, c.created_at, c.updated_at
       FROM critiques c
       JOIN oeuvres o ON c.oeuvre_id = o.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    ),
    // Commentaires rédigés
    db.query(
      `SELECT com.id, com.contenu, com.created_at,
              com.critique_id, u2.pseudo AS auteur_critique
       FROM commentaires com
       JOIN critiques c ON com.critique_id = c.id
       JOIN users u2 ON c.user_id = u2.id
       WHERE com.user_id = ?
       ORDER BY com.created_at DESC`,
      [userId]
    ),
    // Listes créées
    db.query(
      `SELECT l.id, l.nom, l.description, l.visibilite, l.created_at,
              COUNT(lo.oeuvre_id) AS nb_oeuvres
       FROM listes l
       LEFT JOIN liste_oeuvres lo ON l.id = lo.liste_id
       WHERE l.user_id = ?
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
      [userId]
    ),
    // Bibliothèque
    db.query(
      `SELECT bi.id, o.titre AS oeuvre, o.api_reference_id,
              bi.statut, bi.updated_at
       FROM bibliotheque_items bi
       JOIN oeuvres o ON bi.oeuvre_id = o.id
       WHERE bi.user_id = ?
       ORDER BY bi.updated_at DESC`,
      [userId]
    ),
    // Abonnements (utilisateurs suivis)
    db.query(
      `SELECT u.id, u.pseudo, u.photo
       FROM followers f
       JOIN users u ON f.user_follow = u.id
       WHERE f.user_sub = ?
       ORDER BY u.pseudo ASC`,
      [userId]
    ),
    // Abonnés
    db.query(
      `SELECT u.id, u.pseudo, u.photo
       FROM followers f
       JOIN users u ON f.user_sub = u.id
       WHERE f.user_follow = ?
       ORDER BY u.pseudo ASC`,
      [userId]
    ),
    // Signalements envoyés
    db.query(
      `SELECT id, type_contenu, contenu_id, motif, statut, created_at
       FROM signalements
       WHERE signaleur_id = ?
       ORDER BY created_at DESC`,
      [userId]
    ),
  ]);

  return {
    profil: profileRows[0][0] || null,
    critiques: critiquesRows[0],
    commentaires: commentairesRows[0],
    listes: listesRows[0],
    bibliotheque: bibliothequeRows[0],
    abonnements: followingRows[0],
    abonnes: followersRows[0],
    signalements: signalementRows[0],
  };
};

// ==================== GÉNÉRATION CSV ====================

/**
 * Convertit un tableau d'objets en bloc CSV (en-tête + lignes).
 * Les valeurs contenant , " ou \n sont encadrées de guillemets.
 * @param {string} title  Titre de la section (commentaire CSV)
 * @param {Array}  rows   Tableau d'objets homogènes
 * @returns {string}
 */
const sectionToCsv = (title, rows) => {
  if (!rows || rows.length === 0) {
    return `## ${title}\n(aucune donnée)\n`;
  }

  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const headerLine = headers.map(escape).join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => escape(row[h])).join(',')
  );

  return `## ${title}\n${headerLine}\n${dataLines.join('\n')}\n`;
};

/**
 * Génère un fichier CSV complet à partir des données d'export.
 * @param {Object} data  Résultat de getUserExportData()
 * @returns {string}
 */
exports.buildCsv = (data) => {
  const exportedAt = new Date().toISOString();
  const lines = [
    `# Export données personnelles — ${exportedAt}`,
    '',
    sectionToCsv('Profil', data.profil ? [data.profil] : []),
    sectionToCsv('Critiques', data.critiques),
    sectionToCsv('Commentaires', data.commentaires),
    sectionToCsv('Listes', data.listes),
    sectionToCsv('Bibliothèque', data.bibliotheque),
    sectionToCsv('Abonnements (suivis)', data.abonnements),
    sectionToCsv('Abonnés', data.abonnes),
    sectionToCsv('Signalements envoyés', data.signalements),
  ];

  return lines.join('\n');
};
