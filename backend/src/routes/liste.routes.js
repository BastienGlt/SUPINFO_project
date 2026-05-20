const express = require('express');
const router = express.Router();
const listeController = require('../controllers/liste.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Routes publiques
router.get('/public', listeController.getPublicListes);
router.get('/:id/public', listeController.getListe);

// Routes protégées - nécessitent une authentification
router.use(authMiddleware);

// CRUD Listes
router.post('/', listeController.createListe);
router.put('/:id', listeController.updateListe);
router.delete('/:id', listeController.deleteListe);
router.get('/', listeController.getUserListes);
router.get('/user/:userId', listeController.getUserListes);
router.get('/:id', listeController.getListe);

// Œuvres dans les listes
router.get('/:id/oeuvres', listeController.getListeOeuvres);
router.post('/:id/oeuvres', listeController.addOeuvre);
router.delete('/:id/oeuvres/:oeuvreId', listeController.removeOeuvre);

module.exports = router;
