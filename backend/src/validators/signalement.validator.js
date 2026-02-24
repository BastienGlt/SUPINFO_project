const { z } = require('zod');

/**
 * Validators Zod pour les signalements.
 * Utilisé dans signalement.controller.js.
 */

const TYPES_AUTORISES = ['critique', 'commentaire', 'liste'];
const STATUTS_AUTORISES = ['traité', 'rejeté'];

/**
 * Schéma de création d'un signalement (POST /signalements)
 */
const createSignalementSchema = z.object({
  type_contenu: z.enum(TYPES_AUTORISES, {
    errorMap: () => ({
      message: `type_contenu invalide. Valeurs acceptées : ${TYPES_AUTORISES.join(', ')}`,
    }),
  }),
  contenu_id: z
    .number({ invalid_type_error: 'contenu_id doit être un nombre entier positif' })
    .int()
    .positive('contenu_id doit être un entier positif')
    .or(
      z.string().regex(/^\d+$/, 'contenu_id invalide').transform(Number)
    ),
  motif: z
    .string({ required_error: 'Le motif est requis' })
    .trim()
    .min(10, 'Le motif doit contenir au moins 10 caractères')
    .max(1000, 'Le motif ne peut pas dépasser 1000 caractères'),
});

/**
 * Schéma de mise à jour du statut (PUT /signalements/:id/statut)
 */
const updateStatutSchema = z.object({
  statut: z.enum(STATUTS_AUTORISES, {
    errorMap: () => ({
      message: `statut invalide. Valeurs acceptées : ${STATUTS_AUTORISES.join(', ')}`,
    }),
  }),
});

module.exports = { createSignalementSchema, updateStatutSchema };
