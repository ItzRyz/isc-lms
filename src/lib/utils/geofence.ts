// Server-authoritative geofence — jangan percaya client "inside geofence" (AGENTS.md §17)

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

export function isWithinGeofence(
  userLat: number,
  userLon: number,
  centerLat: number,
  centerLon: number,
  radiusMeters: number
): boolean {
  const distance = haversineDistance(userLat, userLon, centerLat, centerLon);
  return distance <= radiusMeters;
}

export function validateAttendanceGeofence(params: {
  userLat: number;
  userLon: number;
  sessionLat: number;
  sessionLon: number;
  radiusMeters: number;
}): { inside: boolean; distance: number } {
  const distance = haversineDistance(
    params.userLat,
    params.userLon,
    params.sessionLat,
    params.sessionLon
  );
  return { inside: distance <= params.radiusMeters, distance };
}
