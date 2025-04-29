/**
 * Calculate the distance between two geographical points using the Haversine formula
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Earth's radius in miles
  const earthRadius = 3958.8;

  // Convert latitude and longitude from degrees to radians
  const latRad1 = (lat1 * Math.PI) / 180;
  const lonRad1 = (lon1 * Math.PI) / 180;
  const latRad2 = (lat2 * Math.PI) / 180;
  const lonRad2 = (lon2 * Math.PI) / 180;

  // Haversine formula
  const dLat = latRad2 - latRad1;
  const dLon = lonRad2 - lonRad1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(latRad1) * Math.cos(latRad2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;

  return distance;
}

/**
 * Format a distance value to a user-friendly string
 * @param distance Distance in miles
 * @returns Formatted string (e.g. "0.5 miles" or "2.1 miles")
 */
export function formatDistance(distance: number | null): string {
  if (distance === null) return "Unknown distance";
  
  if (distance < 0.1) {
    return "Nearby";
  } else if (distance < 1) {
    return `${distance.toFixed(1)} miles`;
  } else {
    return `${Math.round(distance)} miles`;
  }
}