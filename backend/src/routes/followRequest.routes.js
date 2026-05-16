const express = require('express');
const router = express.Router();
const followRequestController = require('../controllers/followRequest.controller');
const checkJwt = require('../middlewares/auth.middleware');

router.post('/', checkJwt, followRequestController.createRequest);
router.get('/', checkJwt, followRequestController.getPendingRequests);
router.patch('/:id', checkJwt, followRequestController.respondToRequest);

module.exports = router;
