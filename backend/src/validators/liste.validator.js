const { z } = require('zod');

/**
 * Validators Zod pour les listes.
 * Utilisé dans liste.controller.js.
 */

const VISIBILITES_VALIDES = ['PUBLIQUE', 'PRIVEE'];

/**
 * Schéma de création de liste (POST /listes)
 */
const createListeSchema = z.object({
  nom: z
    .string({ required_error: 'Le nom de la liste est requis' })
    .trim()
    .min(1, 'Le nom ne peut pas être vide')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z
    .string()
    .trim()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional()
    .nullable(),
  visibilite: z
    .enum(VISIBILITES_VALIDES, {
      errorMap: () => ({
        message: `Visibilité invalide. Valeurs acceptées : ${VISIBILITES_VALIDES.join(', ')}`,
      }),
    })
    .optional()
    .default('PUBLIQUE'),
});

/**
 * Schéma de mise à jour de liste (PUT /listes/:id)
 */
const updateListeSchema = z
  .object({
    nom: z
      .string()
      .trim()
      .min(1, 'Le nom ne peut pas être vide')
      .max(100, 'Le nom ne peut pas dépasser 100 caractères')
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, 'La description ne peut pas dépasser 1000 caractères')
      .optional()
      .nullable(),
    visibilite: z
      .enum(VISIBILITES_VALIDES, {
        errorMap: () => ({
          message: `Visibilité invalide. Valeurs acceptées : ${VISIBILITES_VALIDES.join(', ')}`,
        }),
      })
      .optional(),
  })
  .refine(
    data => Object.values(data).some(v => v !== undefined),
    { message: 'Au moins un champ à mettre à jour est requis' }
  );

module.exports = { createListeSchema, updateListeSchema };
