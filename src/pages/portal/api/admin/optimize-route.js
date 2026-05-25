/**
 * Route Optimization API Endpoint
 * 
 * Provides optimized routing for technician daily schedules.
 * Uses Google Maps or Mapbox for traffic-aware route calculation.
 */

import { getDatabase } from '../../../lib/server/bindings.js';
import { optimizeRoute, clusterJobsByLocation, recommendTechnician } from '../../../lib/dispatch/routeOptimization.js';
import { requireUser } from '../../../lib/server/auth.js';

export const prerender = false;

export async function POST({ request }) {
  try {
    const user = await requireUser(request);
    
    if (!user || !['admin', 'dispatcher'].includes(user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { technicianId, date, options = {} } = body;

    if (!technicianId || !date) {
      return new Response(JSON.stringify({ 
        error: 'Technician ID and date required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = getDatabase();

    // Get technician's scheduled jobs for the date
    const jobs = await db.prepare(`
      SELECT 
        j.id,
        j.job_type,
        j.scheduled_date,
        j.priority,
        j.is_emergency,
        j.required_by_date,
        j.estimated_duration_minutes,
        j.status,
        s.system_type,
        s.coverage_area,
        s.gps_latitude,
        s.gps_longitude,
        st.owner_company_name,
        st.physical_address
      FROM jobs j
      INNER JOIN systems s ON s.id = j.system_id
      INNER JOIN sites st ON st.id = s.site_id
      WHERE j.assigned_technician_id = ?
        AND date(j.scheduled_date) = ?
        AND j.status IN ('Scheduled', 'In Progress')
      ORDER BY 
        CASE j.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 ELSE 3 END,
        j.created_at ASC
    `).all(technicianId, date);

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({
        message: 'No jobs scheduled for this technician on this date',
        optimizedOrder: [],
        totalDistance: 0,
        totalDuration: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get technician's start location (home or office)
    const technician = await db.prepare(`
      SELECT id, name, home_base_lat, home_base_lng
      FROM users
      WHERE id = ?
    `).get(technicianId);

    const startLocation = {
      latitude: technician?.home_base_lat || -33.9249, // Default to Cape Town
      longitude: technician?.home_base_lng || 18.4241
    };

    // Prepare stops for optimization
    const stops = jobs.map(job => ({
      id: job.id,
      latitude: job.gps_latitude,
      longitude: job.gps_longitude,
      priority: job.priority,
      slaDeadline: job.required_by_date,
      ownerCompanyName: job.owner_company_name,
      systemType: job.system_type,
      estimatedDuration: job.estimated_duration_minutes
    })).filter(stop => stop.latitude && stop.longitude);

    if (stops.length === 0) {
      return new Response(JSON.stringify({
        message: 'No jobs with valid coordinates found',
        jobs: jobs.map(j => ({ id: j.id, needsGeocoding: true }))
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Optimize route
    const result = await optimizeRoute(startLocation, stops, {
      considerTraffic: options.considerTraffic !== false,
      prioritizeSla: options.prioritizeSla !== false,
      maxStops: 25
    });

    // Enrich result with job details
    const enrichedResult = {
      ...result,
      technicianId,
      date,
      jobCount: jobs.length,
      jobs: jobs.map(job => {
        const position = result.optimizedOrder.indexOf(job.id);
        return {
          ...job,
          sequencePosition: position >= 0 ? position + 1 : null,
          isOptimized: position >= 0
        };
      }),
      estimatedStartTime: new Date(`${date}T08:00:00`).toISOString(),
      generatedAt: new Date().toISOString()
    };

    return new Response(JSON.stringify(enrichedResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[ROUTE OPTIMIZATION] Error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to optimize route',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET endpoint for job clustering
export async function GET({ url, request }) {
  try {
    const user = await requireUser(request);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const maxDistance = parseFloat(url.searchParams.get('maxDistance')) || 15;

    const db = getDatabase();

    // Get all scheduled jobs for the date
    const jobs = await db.prepare(`
      SELECT 
        j.id,
        j.job_type,
        j.scheduled_date,
        j.priority,
        j.is_emergency,
        j.estimated_duration_minutes,
        j.assigned_technician_id,
        s.system_type,
        s.coverage_area,
        s.gps_latitude,
        s.gps_longitude,
        st.owner_company_name,
        u.name as technician_name
      FROM jobs j
      INNER JOIN systems s ON s.id = j.system_id
      INNER JOIN sites st ON st.id = s.site_id
      LEFT JOIN users u ON u.id = j.assigned_technician_id
      WHERE date(j.scheduled_date) = ?
        AND j.status IN ('Scheduled', 'In Progress')
        AND s.gps_latitude IS NOT NULL
        AND s.gps_longitude IS NOT NULL
    `).all(date);

    // Cluster unassigned jobs
    const unassignedJobs = jobs.filter(j => !j.assigned_technician_id);
    const clusters = clusterJobsByLocation(unassignedJobs, maxDistance);

    return new Response(JSON.stringify({
      date,
      totalJobs: jobs.length,
      unassignedCount: unassignedJobs.length,
      clusters,
      assignedJobs: jobs.filter(j => j.assigned_technician_id)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[ROUTE CLUSTERING] Error:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
