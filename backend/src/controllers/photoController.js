const photoModel = require('../models/photoModel');
const vehicleModel = require('../models/vehicleModel');

/**
 * Upload a photo for a vehicle.
 * Receives { vehicle_id, photo_url } in the body.
 */
async function uploadPhoto(req, res, next) {
  try {
    const { vehicle_id, photo_url } = req.body;
    const driver_id = req.user.id;

    if (!vehicle_id || !photo_url) {
      return res.status(400).json({
        success: false,
        message: 'vehicle_id and photo_url are required.',
      });
    }

    const vehicle = await vehicleModel.findById(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID \${vehicle_id} not found.`,
      });
    }

    const photo = await photoModel.create({
      vehicle_id,
      driver_id,
      photo_url,
    });

    return res.status(201).json({
      success: true,
      message: 'Photo uploaded successfully.',
      data: { photo },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all photos for a given vehicle.
 */
async function getVehiclePhotos(req, res, next) {
  try {
    const { vehicle_id } = req.params;

    const vehicle = await vehicleModel.findById(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID \${vehicle_id} not found.`,
      });
    }

    const photos = await photoModel.findByVehicle(vehicle_id);

    return res.status(200).json({
      success: true,
      data: { photos },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a photo by its ID.
 */
async function deletePhoto(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await photoModel.deleteById(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Photo with ID \${id} not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Photo deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadPhoto, getVehiclePhotos, deletePhoto };
