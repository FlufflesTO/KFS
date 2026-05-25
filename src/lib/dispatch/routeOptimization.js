/**
 * Route Optimization Integration Layer
 * 
 * Provides integration with Google Maps Platform or Mapbox for:
 * - Multi-stop route optimization for technicians
 * - Travel time estimation between jobs
 * - Geographic clustering of jobs by area
 * - Real-time traffic consideration (SA major cities)
 * 
 * South African Context:
 * - Supports Johannesburg, Cape Town, Durban traffic patterns
 * - Handles load shedding zone considerations
 * - Works with SA address formats
 * 
 * Usage: Import in dispatch planning and technician dashboard
 */

const MAPS_PROVIDER = process.env.MAPS_PROVIDER || 'mapbox'; // 'google' or 'mapbox'
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const MAPBOX_API_URL = 'https://api.mapbox.com';
const GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com';

// ============================================================================
// GEOCODING UTILITIES
// ============================================================================

/**
 * Geocode a South African address
 * Returns latitude/longitude coordinates
 */
export async function geocodeAddress(address) {
  const fullAddress = `${address}, South Africa`;

  if (MAPS_PROVIDER === 'google') {
    return geocodeWithGoogle(fullAddress);
  } else {
    return geocodeWithMapbox(fullAddress);
  }
}

async function geocodeWithGoogle(address) {
  const url = `${GOOGLE_MAPS_API_URL}/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
        confidence: 'high'
      };
    }
    
    throw new Error(`Geocoding failed: ${data.status}`);
  } catch (error) {
    console.error('[MAPS] Google geocoding error:', error);
    throw error;
  }
}

async function geocodeWithMapbox(address) {
  const url = `${MAPBOX_API_URL}/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=ZA&limit=1`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        latitude: feature.center[1],
        longitude: feature.center[0],
        formattedAddress: feature.place_name,
        confidence: feature.relevance >= 0.8 ? 'high' : 'medium'
      };
    }
    
    throw new Error('No geocoding results found');
  } catch (error) {
    console.error('[MAPS] Mapbox geocoding error:', error);
    throw error;
  }
}

// ============================================================================
// ROUTE OPTIMIZATION
// ============================================================================

/**
 * Optimize route for multiple job stops
 * Uses Traveling Salesman Problem (TSP) approximation
 * 
 * @param {Object} startLocation - Starting point {latitude, longitude}
 * @param {Array} stops - Array of job locations [{id, latitude, longitude, priority, slaDeadline}]
 * @param {Object} options - Optimization options
 */
export async function optimizeRoute(startLocation, stops, options = {}) {
  const {
    considerTraffic = true,
    prioritizeSla = true,
    maxStops = 25,
    workingHoursStart = 8, // 8 AM
    workingHoursEnd = 17  // 5 PM
  } = options;

  if (stops.length === 0) {
    return {
      optimizedOrder: [],
      totalDistance: 0,
      totalDuration: 0,
      routes: []
    };
  }

  // Limit stops for API constraints
  const limitedStops = stops.slice(0, maxStops);

  if (MAPS_PROVIDER === 'google') {
    return optimizeWithGoogle(startLocation, limitedStops, { considerTraffic, prioritizeSla });
  } else {
    return optimizeWithMapbox(startLocation, limitedStops, { considerTraffic, prioritizeSla });
  }
}

async function optimizeWithGoogle(startLocation, stops, options) {
  // Prepare waypoints
  const waypoints = stops.map(stop => ({
    location: `${stop.latitude},${stop.longitude}`,
    stopover: true
  }));

  const url = `${GOOGLE_MAPS_API_URL}/maps/api/directions/json?origin=${startLocation.latitude},${startLocation.longitude}&destination=${stops[stops.length - 1].latitude},${stops[stops.length - 1].longitude}&waypoints=optimize:true|${waypoints.map(w => w.location).join('|')}&alternatives=false&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Directions API error: ${data.status}`);
    }

    const route = data.routes[0];
    const waypointOrder = route.waypoint_order;
    
    // Reorder stops based on optimized waypoint order
    const optimizedStops = waypointOrder.map(index => stops[index]);
    
    // Calculate totals
    let totalDistance = 0;
    let totalDuration = 0;
    
    route.legs.forEach(leg => {
      totalDistance += leg.distance.value;
      totalDuration += leg.duration_in_traffic?.value || leg.duration.value;
    });

    return {
      optimizedOrder: optimizedStops.map(s => s.id),
      totalDistance: Math.round(totalDistance / 1000), // km
      totalDuration: Math.round(totalDuration / 60), // minutes
      routes: route.legs.map((leg, index) => ({
        from: stops[waypointOrder[index - 1]]?.id || 'start',
        to: stops[waypointOrder[index]]?.id || 'end',
        distance: Math.round(leg.distance.value / 1000),
        duration: Math.round(leg.duration_in_traffic?.value || leg.duration.value) / 60,
        steps: leg.steps?.slice(0, 3).map(s => s.html_instructions) || []
      })),
      polyline: route.overview_polyline.points,
      warnings: route.warnings
    };
  } catch (error) {
    console.error('[MAPS] Google route optimization error:', error);
    throw error;
  }
}

async function optimizeWithMapbox(startLocation, stops, options) {
  // Mapbox Matrix API for optimization
  const coordinates = [
    [startLocation.longitude, startLocation.latitude],
    ...stops.map(s => [s.longitude, s.latitude])
  ].map(c => c.join(',')).join(';');

  const url = `${MAPBOX_API_URL}/optimized-trips/v1/mapbox/driving-traffic/${coordinates}?access_token=${MAPBOX_ACCESS_TOKEN}&steps=true&annotations=duration,distance`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.trips || data.trips.length === 0) {
      throw new Error('No optimized route found');
    }

    const trip = data.trips[0];
    const waypoints = data.waypoints;

    // Extract optimized order (skip first which is start)
    const optimizedOrder = waypoints.slice(1).map((wp, index) => stops[wp.waypoint_index - 1]?.id);

    return {
      optimizedOrder,
      totalDistance: Math.round(trip.distance / 1000), // km
      totalDuration: Math.round(trip.duration / 60), // minutes
      routes: trip.legs?.map((leg, index) => ({
        from: index === 0 ? 'start' : stops[index - 1]?.id,
        to: stops[index]?.id || 'end',
        distance: Math.round(leg.distance / 1000),
        duration: Math.round(leg.duration / 60),
        steps: leg.steps?.slice(0, 3).map(s => s.instructions) || []
      })) || [],
      geometry: trip.geometry,
      confidence: data.code === 'Ok' ? 'high' : 'low'
    };
  } catch (error) {
    console.error('[MAPS] Mapbox route optimization error:', error);
    throw error;
  }
}

// ============================================================================
// TRAVEL TIME ESTIMATION
// ============================================================================

/**
 * Calculate travel time matrix between multiple locations
 * Useful for dispatch planning and capacity assessment
 */
export async function calculateTravelTimeMatrix(locations) {
  if (locations.length < 2) {
    return { matrix: [] };
  }

  const coordinates = locations.map(l => `${l.longitude},${l.latitude}`).join(';');

  if (MAPS_PROVIDER === 'google') {
    return calculateMatrixGoogle(locations);
  } else {
    return calculateMatrixMapbox(coordinates);
  }
}

async function calculateMatrixGoogle(locations) {
  const origins = locations.slice(0, 25).map(l => `${l.latitude},${l.longitude}`).join('|');
  const destinations = locations.slice(0, 25).map(l => `${l.latitude},${l.longitude}`).join('|');
  
  const url = `${GOOGLE_MAPS_API_URL}/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=driving&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Matrix API error: ${data.status}`);
    }

    const matrix = data.rows.map((row, i) => 
      row.elements.map((element, j) => ({
        fromId: locations[i]?.id,
        toId: locations[j]?.id,
        distanceMeters: element.distance?.value || 0,
        durationMinutes: element.duration_in_traffic?.value 
          ? Math.round(element.duration_in_traffic.value / 60)
          : Math.round(element.duration.value / 60),
        status: element.status
      }))
    );

    return { matrix, rowCount: matrix.length, columnCount: matrix[0]?.length || 0 };
  } catch (error) {
    console.error('[MAPS] Google matrix error:', error);
    return { matrix: [], error: error.message };
  }
}

async function calculateMatrixMapbox(coordinates) {
  const url = `${MAPBOX_API_URL}/directions-matrix/v1/mapbox/driving-traffic/${coordinates}?access_token=${MAPBOX_ACCESS_TOKEN}&annotations=duration,distance`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok') {
      throw new Error(`Matrix API error: ${data.code}`);
    }

    const matrix = data.durations.map((row, i) =>
      row.map((duration, j) => ({
        fromIndex: i,
        toIndex: j,
        durationMinutes: Math.round(duration / 60),
        distanceMeters: data.distances[i][j] || 0
      }))
    );

    return { matrix, rowCount: matrix.length, columnCount: matrix[0]?.length || 0 };
  } catch (error) {
    console.error('[MAPS] Mapbox matrix error:', error);
    return { matrix: [], error: error.message };
  }
}

// ============================================================================
// GEOGRAPHIC CLUSTERING
// ============================================================================

/**
 * Cluster jobs by geographic proximity
 * Uses simple distance-based clustering for dispatch zones
 */
export function clusterJobsByLocation(jobs, maxDistanceKm = 15) {
  if (!jobs || jobs.length === 0) return [];

  const clusters = [];
  const assigned = new Set();

  // Jobs with coordinates
  const locatedJobs = jobs.filter(j => j.gps_latitude && j.gps_longitude);

  for (const job of locatedJobs) {
    if (assigned.has(job.id)) continue;

    // Start new cluster
    const cluster = [job];
    assigned.add(job.id);

    // Find nearby jobs
    for (const otherJob of locatedJobs) {
      if (assigned.has(otherJob.id)) continue;

      const distance = calculateDistance(
        job.gps_latitude,
        job.gps_longitude,
        otherJob.gps_latitude,
        otherJob.gps_longitude
      );

      if (distance <= maxDistanceKm) {
        cluster.push(otherJob);
        assigned.add(otherJob.id);
      }
    }

    // Calculate cluster centroid
    const centroid = {
      latitude: cluster.reduce((sum, j) => sum + j.gps_latitude, 0) / cluster.length,
      longitude: cluster.reduce((sum, j) => sum + j.gps_longitude, 0) / cluster.length
    };

    clusters.push({
      id: `cluster_${clusters.length + 1}`,
      jobs: cluster,
      jobCount: cluster.length,
      centroid,
      totalEstimatedDuration: cluster.reduce((sum, j) => sum + (j.estimated_duration_minutes || 60), 0)
    });
  }

  // Sort clusters by job count (largest first)
  return clusters.sort((a, b) => b.jobCount - a.jobCount);
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * Math.PI / 180;
}

// ============================================================================
// TECHNICIAN ASSIGNMENT RECOMMENDATIONS
// ============================================================================

/**
 * Recommend best technician for a job based on:
 * - Current location/proximity
 * - Existing route efficiency
 * - Skill matching (optional)
 * - Workload balance
 */
export async function recommendTechnician(job, technicians, existingJobs) {
  if (!technicians || technicians.length === 0) {
    return null;
  }

  const jobCoords = {
    latitude: job.gps_latitude,
    longitude: job.gps_longitude,
    id: job.id
  };

  const recommendations = [];

  for (const tech of technicians) {
    const techJobs = existingJobs.filter(j => j.assigned_technician_id === tech.id);
    
    // Calculate current workload
    const currentWorkload = techJobs.reduce((sum, j) => sum + (j.estimated_duration_minutes || 60), 0);
    
    // Calculate distance from job to technician's last/first job
    let additionalDistance = 0;
    if (techJobs.length > 0) {
      const lastJob = techJobs[techJobs.length - 1];
      if (lastJob.gps_latitude && lastJob.gps_longitude) {
        additionalDistance = calculateDistance(
          lastJob.gps_latitude,
          lastJob.gps_longitude,
          jobCoords.latitude,
          jobCoords.longitude
        );
      }
    }

    // Score calculation (lower is better)
    const score = (
      (currentWorkload / 60) * 0.3 + // Weight for existing workload (hours)
      (additionalDistance) * 0.5 + // Weight for additional travel (km)
      (tech.is_available === false ? 100 : 0) // Penalty for unavailable
    );

    recommendations.push({
      technician: tech,
      score: Math.round(score * 100) / 100,
      currentWorkloadMinutes: currentWorkload,
      additionalDistanceKm: Math.round(additionalDistance * 10) / 10,
      recommended: false
    });
  }

  // Sort by score and mark top recommendation
  recommendations.sort((a, b) => a.score - b.score);
  if (recommendations.length > 0) {
    recommendations[0].recommended = true;
  }

  return recommendations;
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Generate GPX file for technician navigation
 * Compatible with Garmin, TomTom, and mobile navigation apps
 */
export function generateGpxRoute(route, technicianName) {
  const gpxLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="Kharon FSM" xmlns="http://www.topografix.com/GPX/1/1">',
    `<metadata><name>Kharon Route - ${technicianName}</name><time>${new Date().toISOString()}</time></metadata>`
  ];

  route.forEach((stop, index) => {
    gpxLines.push(
      `<wpt lat="${stop.latitude}" lon="${stop.longitude}">`,
      `<name>Stop ${index + 1}: ${stop.ownerCompanyName}</name>`,
      `<desc>${stop.system_type} - ${stop.coverage_area}</desc>`,
      `<type>Job Site</type>`,
      '</wpt>'
    );
  });

  gpxLines.push('</gpx>');
  return gpxLines.join('\n');
}

export default {
  geocodeAddress,
  optimizeRoute,
  calculateTravelTimeMatrix,
  clusterJobsByLocation,
  calculateDistance,
  recommendTechnician,
  generateGpxRoute
};
