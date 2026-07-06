/**
 * BABIRYE v10.0.0 — Geographic & Location Utilities
 *
 * Pure-function library for geospatial calculations used in VIP protection,
 * sensor placement, geo-fencing, and coordinate handling.
 *
 * All distance calculations use the Haversine formula on the WGS-84 ellipsoid
 * approximation (mean Earth radius = 6 371 km).
 */

// ============================================================================
// Constants
// ============================================================================

/** Mean Earth radius in kilometres (WGS-84 approximation). */
const EARTH_RADIUS_KM = 6371;

/** Mean Earth radius in metres. */
const EARTH_RADIUS_M = EARTH_RADIUS_KM * 1000;

/** Conversion factor: degrees → radians. */
const DEG_TO_RAD = Math.PI / 180;

/** Conversion factor: radians → degrees. */
const RAD_TO_DEG = 180 / Math.PI;

// ============================================================================
// Core Geospatial Functions
// ============================================================================

/**
 * Calculate the great-circle distance between two points using the Haversine formula.
 * Returns the distance in the same unit as the Earth radius used (kilometres).
 *
 * @param lat1 - Latitude of point 1 in decimal degrees.
 * @param lon1 - Longitude of point 1 in decimal degrees.
 * @param lat2 - Latitude of point 2 in decimal degrees.
 * @param lon2 - Longitude of point 2 in decimal degrees.
 * @returns Distance between the two points in kilometres.
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG_TO_RAD) *
      Math.cos(lat2 * DEG_TO_RAD) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Calculate the compass bearing from point 1 to point 2.
 *
 * @param lat1 - Latitude of the origin in decimal degrees.
 * @param lon1 - Longitude of the origin in decimal degrees.
 * @param lat2 - Latitude of the destination in decimal degrees.
 * @param lon2 - Longitude of the destination in decimal degrees.
 * @returns Bearing in degrees (0-360), where 0 = North, 90 = East, etc.
 */
export function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const y = Math.sin(dLon) * Math.cos(lat2 * DEG_TO_RAD);
  const x =
    Math.cos(lat1 * DEG_TO_RAD) * Math.sin(lat2 * DEG_TO_RAD) -
    Math.sin(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.cos(dLon);

  let brng = Math.atan2(y, x) * RAD_TO_DEG;
  return (brng + 360) % 360;
}

/**
 * Calculate the midpoint between two geographic coordinates.
 *
 * @param lat1 - Latitude of point 1 in decimal degrees.
 * @param lon1 - Longitude of point 1 in decimal degrees.
 * @param lat2 - Latitude of point 2 in decimal degrees.
 * @param lon2 - Longitude of point 2 in decimal degrees.
 * @returns An object with `lat` and `lng` in decimal degrees.
 */
export function midpoint(lat1: number, lon1: number, lat2: number, lon2: number): { lat: number; lng: number } {
  const lat1R = lat1 * DEG_TO_RAD;
  const lat2R = lat2 * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;

  const bx = Math.cos(lat2R) * Math.cos(dLon);
  const by = Math.cos(lat2R) * Math.sin(dLon);

  const latMid = Math.atan2(
    Math.sin(lat1R) + Math.sin(lat2R),
    Math.sqrt((Math.cos(lat1R) + bx) * (Math.cos(lat1R) + bx) + by * by)
  );
  const lonMid = lon1 + Math.atan2(by, Math.cos(lat1R) + bx) * RAD_TO_DEG;

  return { lat: latMid * RAD_TO_DEG, lng: ((lonMid + 540) % 360) - 180 };
}

/**
 * Calculate the destination point given a start point, bearing, and distance.
 *
 * @param lat      - Start latitude in decimal degrees.
 * @param lon      - Start longitude in decimal degrees.
 * @param bearing  - Initial bearing in degrees (0-360).
 * @param distance - Distance to travel in kilometres.
 * @returns An object with `lat` and `lng` in decimal degrees.
 */
export function destinationPoint(
  lat: number,
  lon: number,
  bearing: number,
  distance: number
): { lat: number; lng: number } {
  const latR = lat * DEG_TO_RAD;
  const lonR = lon * DEG_TO_RAD;
  const brngR = bearing * DEG_TO_RAD;
  const angularDist = distance / EARTH_RADIUS_KM;

  const destLat = Math.asin(
    Math.sin(latR) * Math.cos(angularDist) +
      Math.cos(latR) * Math.sin(angularDist) * Math.cos(brngR)
  );

  const destLon =
    lonR +
    Math.atan2(
      Math.sin(brngR) * Math.sin(angularDist) * Math.cos(latR),
      Math.cos(angularDist) - Math.sin(latR) * Math.sin(destLat)
    );

  return {
    lat: destLat * RAD_TO_DEG,
    lng: ((destLon * RAD_TO_DEG + 540) % 360) - 180,
  };
}

// ============================================================================
// Coordinate Formatting
// ============================================================================

/**
 * Convert decimal coordinates to Degrees-Minutes-Seconds (DMS) string.
 * Format: "40° 26' 46.00\" N, 79° 58' 56.00\" W"
 *
 * @param lat - Latitude in decimal degrees.
 * @param lon - Longitude in decimal degrees.
 * @returns A human-readable DMS string.
 */
export function coordinateToDms(lat: number, lon: number): string {
  const latDms = decimalToDms(lat, 'lat');
  const lonDms = decimalToDms(lon, 'lon');
  return `${latDms}, ${lonDms}`;
}

/**
 * Parse a DMS coordinate string back into decimal degrees.
 * Supports formats like:
 *   - "40° 26' 46\" N, 79° 58' 56\" W"
 *   - "40°26'46\"N, 79°58'56\"W"
 *   - "N40° 26' 46\", W79° 58' 56\""
 *
 * @param dms - The DMS string to parse.
 * @returns An object with `lat` and `lng`, or `null` if parsing fails.
 */
export function dmsToCoordinate(dms: string): { lat: number; lng: number } | null {
  try {
    // Match one or two DMS components
    const pattern = /([NSEW])?\s*(\d{1,3})\s*[°]\s*(\d{1,2})\s*[′']\s*([\d.]+)\s*[″"]/gi;
    const matches = [...dms.matchAll(pattern)];

    if (matches.length < 2) {
      // Try alternate format: DMS with letter suffix
      const altPattern = /(\d{1,3})\s*[°]\s*(\d{1,2})\s*[′']\s*([\d.]+)\s*[″"]\s*([NSEW])/gi;
      const altMatches = [...dms.matchAll(altPattern)];
      if (altMatches.length < 2) return null;

      const latMatch = altMatches.find((m) => m[4]?.toUpperCase() === 'N' || m[4]?.toUpperCase() === 'S');
      const lonMatch = altMatches.find((m) => m[4]?.toUpperCase() === 'E' || m[4]?.toUpperCase() === 'W');

      if (!latMatch || !lonMatch) return null;

      const lat = dmsToDecimal(
        parseFloat(latMatch[1]),
        parseFloat(latMatch[2]),
        parseFloat(latMatch[3]),
        latMatch[4].toUpperCase() === 'S'
      );
      const lng = dmsToDecimal(
        parseFloat(lonMatch[1]),
        parseFloat(lonMatch[2]),
        parseFloat(lonMatch[3]),
        lonMatch[4].toUpperCase() === 'W'
      );

      return { lat, lng };
    }

    // First match = lat, second = lon
    const latDir = matches[0][1]?.toUpperCase();
    const lonDir = matches[1][1]?.toUpperCase();

    const lat = dmsToDecimal(
      parseFloat(matches[0][2]),
      parseFloat(matches[0][3]),
      parseFloat(matches[0][4]),
      latDir === 'S'
    );
    const lng = dmsToDecimal(
      parseFloat(matches[1][2]),
      parseFloat(matches[1][3]),
      parseFloat(matches[1][4]),
      lonDir === 'W'
    );

    return { lat, lng };
  } catch {
    return null;
  }
}

/**
 * Calculate the distance between two points in kilometres (alias for haversineDistance).
 *
 * @param lat1 - Latitude of point 1 in decimal degrees.
 * @param lon1 - Longitude of point 1 in decimal degrees.
 * @param lat2 - Latitude of point 2 in decimal degrees.
 * @param lon2 - Longitude of point 2 in decimal degrees.
 * @returns Distance in kilometres.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineDistance(lat1, lon1, lat2, lon2);
}

/**
 * Format coordinates as a clean decimal string.
 *
 * @param lat       - Latitude in decimal degrees.
 * @param lon       - Longitude in decimal degrees.
 * @param precision - Number of decimal places (default 6).
 * @returns Formatted string like "40.446111, -79.982222".
 */
export function formatCoordinates(lat: number, lon: number, precision: number = 6): string {
  return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`;
}

// ============================================================================
// Geo-Fence & Proximity
// ============================================================================

/**
 * Check if a point is within a given radius of a centre point.
 *
 * @param lat       - Latitude of the point to check.
 * @param lon       - Longitude of the point to check.
 * @param centerLat - Latitude of the centre.
 * @param centerLon - Longitude of the centre.
 * @param radiusKm  - Radius in kilometres.
 * @returns `true` if the point is within the radius.
 */
export function isPointInRadius(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number,
  radiusKm: number
): boolean {
  return haversineDistance(lat, lon, centerLat, centerLon) <= radiusKm;
}

/**
 * Calculate a bounding box around a centre point with a given radius.
 * Returns north/south/east/west bounds in decimal degrees.
 *
 * @param lat      - Centre latitude in decimal degrees.
 * @param lon      - Centre longitude in decimal degrees.
 * @param radiusKm - Radius in kilometres.
 * @returns Bounding box with north, south, east, west decimal degree bounds.
 */
export function getBoundingBox(
  lat: number,
  lon: number,
  radiusKm: number
): { north: number; south: number; east: number; west: number } {
  const northPoint = destinationPoint(lat, lon, 0, radiusKm);
  const southPoint = destinationPoint(lat, lon, 180, radiusKm);
  const eastPoint = destinationPoint(lat, lon, 90, radiusKm);
  const westPoint = destinationPoint(lat, lon, 270, radiusKm);

  return {
    north: northPoint.lat,
    south: southPoint.lat,
    east: eastPoint.lng,
    west: westPoint.lng,
  };
}

/**
 * Check if any of the given breach points fall outside a geo-fence boundary.
 *
 * @param breachPoints   - Array of { lat, lng } points to check.
 * @param fenceBoundary  - The bounding box { north, south, east, west } defining the fence.
 * @returns An object indicating whether a breach occurred and, if so, the first breaching point.
 */
export function geoFenceAlert(
  breachPoints: { lat: number; lng: number }[],
  fenceBoundary: { north: number; south: number; east: number; west: number }
): { breached: boolean; point?: { lat: number; lng: number } } {
  for (const pt of breachPoints) {
    if (
      pt.lat > fenceBoundary.north ||
      pt.lat < fenceBoundary.south ||
      pt.lng > fenceBoundary.east ||
      pt.lng < fenceBoundary.west
    ) {
      return { breached: true, point: { lat: pt.lat, lng: pt.lng } };
    }
  }
  return { breached: false };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clamp a latitude value to the valid range of -90 to +90 degrees.
 *
 * @param lat - The latitude value to clamp.
 * @returns The clamped latitude.
 */
export function clampLatitude(lat: number): number {
  return Math.max(-90, Math.min(90, lat));
}

/**
 * Get the timezone offset of the current environment in minutes (positive east of UTC).
 *
 * @returns Offset in minutes, or 0 if in a non-browser / non-Node environment.
 */
export function getTimezoneOffset(): number {
  if (typeof Intl !== 'undefined') {
    // Try to get from timezone string
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date();
      const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
      return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
    } catch {
      // Fallback to built-in offset
    }
  }
  return new Date().getTimezoneOffset() * -1;
}

/**
 * Get the current UTC time as an ISO string.
 *
 * @returns Current UTC time in ISO 8601 format.
 */
export function getUtcTime(): string {
  return new Date().toISOString();
}

/**
 * Format a Date object into a human-readable string in the given timezone.
 *
 * @param timezone - IANA timezone identifier (e.g. "America/New_York", "UTC").
 * @param date     - The date to format (defaults to now).
 * @returns Formatted date/time string.
 */
export function formatTimezone(timezone: string, date: Date = new Date()): string {
  try {
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    });
  } catch {
    // Invalid timezone — fallback to UTC
    return date.toUTCString();
  }
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Convert a single decimal degree value to DMS components and format.
 */
function decimalToDms(decimal: number, axis: 'lat' | 'lon'): string {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesDecimal = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = ((minutesDecimal - minutes) * 60).toFixed(2);

  let direction: string;
  if (axis === 'lat') {
    direction = decimal >= 0 ? 'N' : 'S';
  } else {
    direction = decimal >= 0 ? 'E' : 'W';
  }

  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

/**
 * Convert DMS components to decimal degrees.
 */
function dmsToDecimal(degrees: number, minutes: number, seconds: number, isNegative: boolean): number {
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (isNegative) decimal = -decimal;
  return decimal;
}