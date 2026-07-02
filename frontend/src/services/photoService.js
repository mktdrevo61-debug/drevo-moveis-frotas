import api from './api.js';

export async function uploadPhoto({ vehicle_id, photo_url }) {
  const { data } = await api.post('/photos', {
    vehicle_id: Number(vehicle_id),
    photo_url,
  });
  return data.data?.photo || data.data;
}

export async function getVehiclePhotos(vehicle_id) {
  const { data } = await api.get(`/photos/vehicle/${vehicle_id}`);
  return data.data?.photos || [];
}
