const winston = require('winston');
const path = require('path');

/**
 * Module de logging sécurité
 * - Logs applicatifs : console + fichier app.log
 * - Logs sécurité  : fichier security.log (warn et au-dessus uniquement)
 */

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const base = `${timestamp} [${level}] ${message}`;
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return stack ? `${base}${metaStr}\n${stack}` : `${base}${metaStr}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Logs console (développement)
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
      ),
    }),
    // Logs applicatifs complets
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/app.log'),
      maxsize: 5 * 1024 * 1024, // 5 Mo
      maxFiles: 5,
    }),
    // Logs sécurité uniquement (warn, error)
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/security.log'),
      level: 'warn',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

/**
 * Log d'un événement de sécurité (accès refusé, action admin, tentative suspecte).
 * @param {string} action   - Identifiant de l'action (ex: 'ADMIN_BAN_USER')
 * @param {object} meta     - Données contextuelles (userId, ip, etc.)
 */
logger.security = (action, meta = {}) => {
  logger.warn(action, { ...meta, security: true });
};

module.exports = logger;
