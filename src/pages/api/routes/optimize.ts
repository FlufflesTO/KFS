

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  try {
    const contentType = request.headers.get("Content-Type");
    if (!contentType?.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Invalid content type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const body = await request.json();
    const { jobs, technicianLocation } = body;
    
    if (!jobs || !Array.isArray(jobs) || !technicianLocation) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Calculate optimized route using distance matrix
    const optimizedRoute = await calculateOptimizedRoute(jobs, technicianLocation);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        route: optimizedRoute,
        totalDistance: optimizedRoute.distance,
        estimatedTime: optimizedRoute.time
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Route optimization failed:", error);
    return new Response(
      JSON.stringify({ error: "Route optimization failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Simple distance calculation (in production, use a mapping service like Google Maps API)
async function calculateOptimizedRoute(jobs: Array<any>, startLocation: { lat: number, lng: number }) {
  // This is a simplified implementation
  // In production, use a proper routing algorithm or mapping service
  
  // Calculate distances between locations
  const locations = [
    { ...startLocation, id: 'start', type: 'start' },
    ...jobs.map((job) => ({
      id: job.id,
      type: 'job',
      lat: job.gps_latitude || 0,
      lng: job.gps_longitude || 0,
      address: job.address || ''
    }))
  ];
  
  // Simple nearest neighbor algorithm
  const route = [locations[0]]; // Start with technician location
  const remaining = locations.slice(1);
  
  while (remaining.length > 0) {
    const current = route[route.length - 1];
    let nearestIndex = 0;
    let minDistance = Number.MAX_VALUE;
    
    for (let i = 0; i < remaining.length; i++) {
      if (!current || !remaining[i]) continue;
      const distance = calculateDistance(current, remaining[i]!);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }
    
    route.push(remaining.splice(nearestIndex, 1)[0]);
  }
  
  // Calculate total distance and estimated time
  let totalDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    if (route[i] && route[i + 1]) {
      totalDistance += calculateDistance(route[i]!, route[i + 1]!);
    }
  }
  
  // Estimate time (assuming average speed of 40 km/h)
  const estimatedTime = totalDistance / 40 * 60; // in minutes
  
  return {
    stops: route.map(location => location?.id),
    distance: totalDistance,
    time: estimatedTime,
    orderedJobs: route.filter(loc => loc?.type === 'job').map(loc => loc?.id)
  };
}

// Simple distance calculation using Haversine formula
function calculateDistance(loc1: { lat: number, lng: number }, loc2: { lat: number, lng: number }) {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(loc2.lat - loc1.lat);
  const dLon = deg2rad(loc2.lng - loc1.lng);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(loc1.lat)) * Math.cos(deg2rad(loc2.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}
