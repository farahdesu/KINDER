// Location-Based Matching for KINDER Platform
// Uses Haversine formula for distance calculation
// For production, integrate with Google Maps API

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return parseFloat(distance.toFixed(2));
}

/**
 * Find nearby babysitters for a parent
 * @param {object} parentLocation - { latitude, longitude }
 * @param {array} babysitters - Array of babysitter objects with location
 * @param {number} maxDistance - Maximum distance in km (default: 5)
 * @returns {array} - Sorted array of nearby babysitters with distance
 */
function findNearbyBabysitters(parentLocation, babysitters, maxDistance = 5) {
  if (!parentLocation || !parentLocation.latitude || !parentLocation.longitude) {
    return [];
  }

  const nearby = [];

  for (const babysitter of babysitters) {
    // Check if babysitter has location data
    if (!babysitter.location || !babysitter.location.coordinates) {
      continue;
    }

    const [babysitterLon, babysitterLat] = babysitter.location.coordinates;
    
    const distance = calculateDistance(
      parentLocation.latitude,
      parentLocation.longitude,
      babysitterLat,
      babysitterLon
    );

    // Check if within service radius
    if (distance <= maxDistance) {
      nearby.push({
        ...babysitter,
        distance: distance,
        distanceLabel: `${distance} km away`
      });
    }
  }

  // Sort by distance (closest first)
  nearby.sort((a, b) => a.distance - b.distance);

  return nearby;
}

/**
 * Calculate travel time estimate (simple approximation)
 * For production, use Google Maps Distance Matrix API
 * @param {number} distance - Distance in kilometers
 * @param {string} mode - 'car', 'bike', 'walk' (default: 'car')
 * @returns {object} - { minutes: number, label: string }
 */
function estimateTravelTime(distance, mode = 'car') {
  let speedKmPerHour;
  
  switch (mode) {
    case 'walk':
      speedKmPerHour = 5;
      break;
    case 'bike':
      speedKmPerHour = 15;
      break;
    case 'car':
    default:
      speedKmPerHour = 30; // Average city speed
  }

  const minutes = Math.ceil((distance / speedKmPerHour) * 60);
  
  let label;
  if (minutes < 5) {
    label = 'Very close';
  } else if (minutes < 15) {
    label = 'Close by';
  } else if (minutes < 30) {
    label = 'Nearby';
  } else {
    label = 'Far';
  }

  return {
    minutes,
    label,
    mode
  };
}

/**
 * Score babysitters based on multiple factors for smart matching
 * @param {object} babysitter - Babysitter object
 * @param {object} parent - Parent object
 * @param {number} distance - Distance in km
 * @returns {number} - Match score (0-100)
 */
function calculateMatchScore(babysitter, parent, distance) {
  let score = 0;

  // Distance score (40 points max)
  // Closer = higher score
  const distanceScore = Math.max(0, 40 - (distance * 4));
  score += distanceScore;

  // Rating score (30 points max)
  const ratingScore = (babysitter.rating || 0) / 5 * 30;
  score += ratingScore;

  // Experience score (15 points max)
  const experienceMap = {
    'Beginner (0-1 years)': 5,
    'Intermediate (1-3 years)': 10,
    'Experienced (3+ years)': 15
  };
  const experienceScore = experienceMap[babysitter.experience] || 0;
  score += experienceScore;

  // Availability score (10 points max)
  // Check if babysitter has availability set
  const hasAvailability = babysitter.availability && 
    Object.values(babysitter.availability).some(day => day && day.length > 0);
  score += hasAvailability ? 10 : 0;

  // Hourly rate consideration (bonus/penalty)
  // Reasonable rates get bonus
  if (babysitter.hourlyRate >= 200 && babysitter.hourlyRate <= 500) {
    score += 5;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Get smart match recommendations
 * @param {object} parent - Parent object with location
 * @param {array} babysitters - Array of babysitter objects
 * @param {object} preferences - Parent preferences { maxDistance, minRating, maxRate }
 * @returns {array} - Top matched babysitters with scores
 */
function getSmartMatches(parent, babysitters, preferences = {}) {
  const {
    maxDistance = 5,
    minRating = 0,
    maxRate = 1000,
    limit = 5
  } = preferences;

  if (!parent.location || !parent.location.coordinates) {
    return [];
  }

  const [parentLon, parentLat] = parent.location.coordinates;
  const parentLocation = { latitude: parentLat, longitude: parentLon };

  // Filter babysitters based on preferences
  const filtered = babysitters.filter(bs => {
    if (!bs.location || !bs.location.coordinates) return false;
    if ((bs.rating || 0) < minRating) return false;
    if ((bs.hourlyRate || 0) > maxRate) return false;
    
    const [bsLon, bsLat] = bs.location.coordinates;
    const distance = calculateDistance(parentLat, parentLon, bsLat, bsLon);
    
    return distance <= maxDistance;
  });

  // Calculate match scores
  const scored = filtered.map(bs => {
    const [bsLon, bsLat] = bs.location.coordinates;
    const distance = calculateDistance(parentLat, parentLon, bsLat, bsLon);
    const matchScore = calculateMatchScore(bs, parent, distance);
    const travelTime = estimateTravelTime(distance);

    return {
      ...bs,
      distance,
      matchScore,
      travelTime,
      matchLabel: getMatchLabel(matchScore)
    };
  });

  // Sort by match score (highest first)
  scored.sort((a, b) => b.matchScore - a.matchScore);

  return scored.slice(0, limit);
}

/**
 * Get human-readable match label
 * @param {number} score - Match score (0-100)
 * @returns {string} - Label
 */
function getMatchLabel(score) {
  if (score >= 85) return 'Perfect Match';
  if (score >= 70) return 'Great Match';
  if (score >= 55) return 'Good Match';
  if (score >= 40) return 'Fair Match';
  return 'Low Match';
}

/**
 * Validate location coordinates
 * @param {array} coordinates - [longitude, latitude]
 * @returns {boolean} - Valid or not
 */
function isValidCoordinates(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false;
  }

  const [lon, lat] = coordinates;
  
  // Validate latitude (-90 to 90)
  if (lat < -90 || lat > 90) return false;
  
  // Validate longitude (-180 to 180)
  if (lon < -180 || lon > 180) return false;

  return true;
}

/**
 * Get location bounds for a center point and radius
 * @param {array} center - [longitude, latitude]
 * @param {number} radiusKm - Radius in kilometers
 * @returns {object} - { minLat, maxLat, minLon, maxLon }
 */
function getLocationBounds(center, radiusKm) {
  const [lon, lat] = center;
  
  // Approximate degrees per km
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLon: lon - lonDelta,
    maxLon: lon + lonDelta
  };
}

module.exports = {
  calculateDistance,
  findNearbyBabysitters,
  estimateTravelTime,
  calculateMatchScore,
  getSmartMatches,
  getMatchLabel,
  isValidCoordinates,
  getLocationBounds
};
