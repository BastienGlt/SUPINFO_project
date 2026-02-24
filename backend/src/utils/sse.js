/**
 * Module SSE (Server-Sent Events)
 * Gère les connexions temps réel unidirectionnelles serveur → client.
 *
 * Un utilisateur peut avoir plusieurs onglets ouverts : on stocke un Set
 * de responses par userId.
 */

// Map<userId, Set<res>>
const clients = new Map();

/**
 * Enregistre une connexion SSE pour un utilisateur.
 * @param {number} userId
 * @param {object} res - Express response
 */
function addClient(userId, res) {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId).add(res);
}

/**
 * Supprime une connexion SSE (fermeture d'onglet, déconnexion).
 * @param {number} userId
 * @param {object} res - Express response
 */
function removeClient(userId, res) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(userId);
}

/**
 * Envoie un événement SSE à toutes les connexions actives d'un utilisateur.
 * @param {number} userId
 * @param {string} event - Nom de l'événement (ex. 'notification')
 * @param {object} data  - Données à sérialiser en JSON
 */
function sendToUser(userId, event, data) {
  const set = clients.get(userId);
  if (!set || set.size === 0) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    res.write(payload);
  }
}

module.exports = { addClient, removeClient, sendToUser };
