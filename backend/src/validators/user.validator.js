const { z } = require('zod');

/**
 * Validators Zod pour les entrées utilisateur.
 * Utilisé dans user.controller.js (createUser, updateUser).
 */

const PSEUDO_REGEX = /^[a-zA-Z0-9_\-]+$/;

// Champs de base partagés
const pseudoField = z
  .string({ required_error: 'Le pseudo est obligatoire' })
  .trim()
  .min(3, 'Le pseudo doit contenir au moins 3 caractères')
  .max(30, 'Le pseudo ne peut pas dépasser 30 caractères')
  .regex(PSEUDO_REGEX, 'Le pseudo ne peut contenir que des lettres, chiffres, _ et -');

const prenomField = z
  .string({ required_error: 'Le prénom est obligatoire' })
  .trim()
  .min(1, 'Le prénom est obligatoire')
  .max(50, 'Le prénom ne peut pas dépasser 50 caractères');

const nomField = z
  .string({ required_error: 'Le nom est obligatoire' })
  .trim()
  .min(1, 'Le nom est obligatoire')
  .max(50, 'Le nom ne peut pas dépasser 50 caractères');

const bioField = z
  .string()
  .trim()
  .max(500, 'La biographie ne peut pas dépasser 500 caractères')
  .optional()
  .nullable();

// Validation URL photo : doit être une URL http/https ou null
const photoField = z
  .string()
  .trim()
  .url('La photo doit être une URL valide')
  .max(500, "L'URL de la photo est trop longue")
  .optional()
  .nullable()
  .or(z.literal(''))
  .transform(v => (v === '' ? null : v));

/**
 * Schéma de création d'utilisateur (POST /users/create)
 * prenom, nom, pseudo sont obligatoires.
 */
const createUserSchema = z.object({
  prenom: prenomField,
  nom: nomField,
  pseudo: pseudoField,
  bio: bioField,
});

/**
 * Schéma de mise à jour d'utilisateur (PUT /users/:id)
 * Tous les champs sont optionnels, mais au moins 1 doit être présent.
 */
const updateUserSchema = z
  .object({
    prenom: prenomField.optional(),
    nom: nomField.optional(),
    pseudo: pseudoField.optional(),
    bio: bioField,
    photo: photoField,
  })
  .refine(
    data => Object.values(data).some(v => v !== undefined),
    { message: 'Au moins un champ à mettre à jour est requis' }
  );

module.exports = { createUserSchema, updateUserSchema };
