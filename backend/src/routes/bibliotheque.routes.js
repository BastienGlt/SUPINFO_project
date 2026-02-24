const express = require('express');
const router = express.Router();
const bibliothequeController = require('../controllers/bibliotheque.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Routes protégées - nécessitent une authentification
router.use(authMiddleware);

// CRUD Bibliothèque
router.post('/items', (req, res) => bibliothequeController.addItem(req, res));
router.put('/items/:id', (req, res) => bibliothequeController.updateItem(req, res));
router.delete('/items/:id', (req, res) => bibliothequeController.deleteItem(req, res));
router.get('/items', (req, res) => bibliothequeController.getBibliotheque(req, res));
router.get('/items/user/:userId', (req, res) => bibliothequeController.getBibliotheque(req, res));

module.exports = router;
