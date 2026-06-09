const express = require('express');
const router = express.Router();
const oeuvreController = require('../controllers/oeuvre.controller');

// GET /oeuvres/notes-moyennes - Liste toutes les oeuvres avec leur note moyenne
router.get('/notes-moyennes', oeuvreController.getAllNotesMoyennes);

// GET /oeuvres/:id/note-moyenne - Note moyenne d'une oeuvre par api_reference_id
router.get('/:id/note-moyenne', oeuvreController.getNoteMoyenneByApiRef);

module.exports = router;
