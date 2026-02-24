const { z } = require('zod');

/**
 * Validators Zod pour les commentaires.
 * Utilisé dans commentaire.controller.js.
 */

/**
 * Schéma de création/mise à jour d'un commentaire
 */
const commentaireSchema = z.object({
  contenu: z
    .string({ required_error: 'Le contenu est obligatoire' })
    .trim()
    .min(1, 'Le contenu ne peut pas être vide')
    .max(2000, 'Le commentaire ne peut pas dépasser 2000 caractères'),
});

module.exports = { commentaireSchema };
