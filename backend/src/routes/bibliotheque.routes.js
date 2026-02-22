const express = require('express');
const router = express.Router();
const bibliothequeController = require('../controllers/bibliotheque.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Routes protégées - nécessitent une authentification
router.use(authMiddleware);

// CRUD Bibliothèque
router.post('/items', bibliothequeController.addItem);
router.put('/items/:id', bibliothequeController.updateItem);
router.delete('/items/:id', bibliothequeController.deleteItem);
router.get('/items', bibliothequeController.getBibliotheque);
router.get('/items/user/:userId', bibliothequeController.getBibliotheque);

module.exports = router;
