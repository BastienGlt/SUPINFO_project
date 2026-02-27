const userService = require('../services/user.service');

/**
 * Middleware global de vérification du statut utilisateur.
 *
 * S'exécute sur toutes les requêtes portant un Bearer token.
 * Bloque les utilisateurs bannis AVANT que la route ne soit traitée,
 * sans re-valider la signature JWT (checkJwt par route s'en charge).
 *
 * Décode simplement le payload Base64 pour extraire le claim `sub` (auth0_id).
 * Si le token est forgé, la vérification cryptographique de checkJwt rejettera
 * la requête de toute façon.
 */
const checkActive = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // pas de token — route publique, on passe
  }

  try {
    const token = authHeader.split(' ')[1];
    const parts = token.split('.');
    if (parts.length !== 3) return next(); // token malformé, laisse checkJwt gérer

    // Décodage Base64 du payload (sans vérification de signature)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    const auth0Id = payload.sub;
    if (!auth0Id) return next();

    const user = await userService.getUserByAuth0Id(auth0Id);
    if (user && user.status === 'banned') {
      return res.status(403).json({ error: 'Votre compte a été banni' });
    }

    next();
  } catch {
    next(); // erreur inattendue → laisse la requête continuer normalement
  }
};

module.exports = checkActive;
