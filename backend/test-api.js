/**
 * Script de test de l'API de notation
 * Lancer le serveur avant d'exécuter ce script : npm run dev
 * Puis exécuter : node test-api.js
 */

const http = require('http');

// Fonction helper pour faire des requêtes HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(body)
          };
          resolve(response);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Tests
async function runTests() {
  console.log('🧪 Test de l\'API de notation des œuvres\n');
  console.log('='.repeat(50));

  try {
    // Test 1 : Récupérer les statistiques d'une œuvre
    console.log('\n📊 Test 1 : GET /oeuvres/1/ratings/stats');
    const stats = await makeRequest('GET', '/oeuvres/1/ratings/stats');
    console.log(`Status: ${stats.status}`);
    console.log('Réponse:', JSON.stringify(stats.body, null, 2));

    // Test 2 : Récupérer toutes les notes d'une œuvre
    console.log('\n📝 Test 2 : GET /oeuvres/1/ratings');
    const ratings = await makeRequest('GET', '/oeuvres/1/ratings');
    console.log(`Status: ${ratings.status}`);
    console.log('Réponse:', JSON.stringify(ratings.body, null, 2));

    // Test 3 : Récupérer les notes d'un utilisateur
    console.log('\n👤 Test 3 : GET /users/1/ratings');
    const userRatings = await makeRequest('GET', '/users/1/ratings');
    console.log(`Status: ${userRatings.status}`);
    console.log('Réponse:', JSON.stringify(userRatings.body, null, 2));

    // Test 4 : Vérifier route 404
    console.log('\n❌ Test 4 : GET /route/inexistante (test 404)');
    const notFound = await makeRequest('GET', '/route/inexistante');
    console.log(`Status: ${notFound.status}`);
    console.log('Réponse:', JSON.stringify(notFound.body, null, 2));

    console.log('\n' + '='.repeat(50));
    console.log('✅ Tests terminés !');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    console.log('\n⚠️  Assurez-vous que le serveur est lancé : npm run dev');
  }
}

// Exécuter les tests
runTests();
