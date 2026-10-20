export function hasValidCoordinates(destination) {
  return Number.isFinite(destination?.latitude)
    && Number.isFinite(destination?.longitude)
    && destination.latitude >= -90
    && destination.latitude <= 90
    && destination.longitude >= -180
    && destination.longitude <= 180
}

export function normalizePlaceSearch(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR')
}

export function getDestinationVector(latitude, longitude, radius = 1) {
  const lat = (latitude * Math.PI) / 180
  const lon = (longitude * Math.PI) / 180
  const cosLat = Math.cos(lat)
  // Match Three.js SphereGeometry UVs: texture U=0.5 (Greenwich) lies on +X.
  return [cosLat * Math.cos(lon) * radius, Math.sin(lat) * radius, -cosLat * Math.sin(lon) * radius]
}
