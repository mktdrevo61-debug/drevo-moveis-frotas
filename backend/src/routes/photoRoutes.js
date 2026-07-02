const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const authMiddleware = require('../middlewares/authMiddleware');

// All photo routes require authentication
router.use(authMiddleware);

// Driver uploads a photo
router.post('/', photoController.uploadPhoto);

// Get photos for a vehicle
router.get('/vehicle/:vehicle_id', photoController.getVehiclePhotos);

// Delete a photo
router.delete('/:id', photoController.deletePhoto);

module.exports = router;
