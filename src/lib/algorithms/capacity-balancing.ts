/**
 * Technician Capacity Balancing Algorithm
 * Purpose: Calculates availability of field personnel to ensure efficient dispatch routing
 * without violating working-hour constraints
 */

export interface Technician {
  id: string;
  name: string;
  credentials: string[]; // SAQCC certifications
  daily_queue: ScheduledJob[];
  max_daily_capacity: number; // in hours
  current_availability: boolean;
}

export interface ScheduledJob {
  id: string;
  estimated_hours: number;
  travel_time: number; // in hours
  saqcc_codes: string[]; // required certifications
  date: Date;
}

export interface JobRequirements {
  estimated_hours: number;
  saqcc_codes: string[];
  travel_time?: number;
}

/**
 * Determines if a technician has the required certifications for a job
 * @param techCredentials Technician's certifications
 * @param requiredCodes Required certifications for the job
 * @returns Boolean indicating if technician is qualified
 */
function hasCertification(techCredentials: string[], requiredCodes: string[]): boolean {
  return requiredCodes.every(code => techCredentials.includes(code));
}

/**
 * Calculates the total load for a technician on a given day
 * @param dailyQueue Technician's scheduled jobs
 * @returns Total hours allocated for the day
 */
function calculateDailyLoad(dailyQueue: ScheduledJob[]): number {
  return dailyQueue.reduce((total, job) => total + job.estimated_hours + job.travel_time, 0);
}

/**
 * Calculates the optimal technician for a given job based on availability and qualifications
 * @param jobRequirements Requirements for the job to be assigned
 * @param availableTechnicians List of currently available technicians
 * @returns The most suitable technician for the job or null if none available
 */
export function calculateOptimalTechnician(
  jobRequirements: JobRequirements,
  availableTechnicians: Technician[]
): Technician | null {
  const jobDuration = jobRequirements.estimated_hours + (jobRequirements.travel_time || 0);
  const requiredCertifications = jobRequirements.saqcc_codes;
  let bestTechnician: Technician | null = null;
  let lowestLoad = Infinity;

  for (const tech of availableTechnicians) {
    // Gate 0: Skip technicians who are not currently available (on leave / off shift)
    if (!tech.current_availability) {
      continue;
    }

    // Gate 1: Check compliance qualifications
    if (!hasCertification(tech.credentials, requiredCertifications)) {
      continue;
    }

    // Gate 2: Calculate aggregate daily load
    const currentLoad = calculateDailyLoad(tech.daily_queue);
    
    // Gate 3: Check against maximum operational hours (e.g., 8 hours)
    if ((currentLoad + jobDuration) > tech.max_daily_capacity) {
      continue;
    }

    // Gate 4: Identify lowest utilized compliant technician
    if (currentLoad < lowestLoad) {
      lowestLoad = currentLoad;
      bestTechnician = tech;
    }
  }

  return bestTechnician;
}

/**
 * Calculates technician utilization percentage
 * @param tech Technician to evaluate
 * @returns Utilization percentage
 */
export function calculateUtilization(tech: Technician): number {
  const dailyLoad = calculateDailyLoad(tech.daily_queue);
  return Math.min(100, (dailyLoad / tech.max_daily_capacity) * 100);
}

/**
 * Finds available time slots for a technician
 * @param tech Technician to evaluate
 * @param jobDuration Duration of the job in hours
 * @returns Available time slots for the job
 */
export function findAvailableSlots(tech: Technician, jobDuration: number): Date[] {
  // Simplified logic - in a real implementation this would check actual calendar conflicts
  const availableSlots: Date[] = [];
  const currentLoad = calculateDailyLoad(tech.daily_queue);
  const remainingCapacity = tech.max_daily_capacity - currentLoad;
  
  if (remainingCapacity >= jobDuration) {
    // Return next available slot (simplified)
    const nextSlot = new Date();
    nextSlot.setDate(nextSlot.getDate() + 1); // Tomorrow as example
    availableSlots.push(nextSlot);
  }
  
  return availableSlots;
}
