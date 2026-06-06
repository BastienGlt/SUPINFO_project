const { auth } = require('express-oauth2-jwt-bearer');

const jwtVerifier = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256'
});

// Vérifie le JWT si présent, mais ne bloque pas si absent
const checkJwtOptional = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  jwtVerifier(req, res, next);
};

module.exports = checkJwtOptional;
