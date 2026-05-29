/**
 * Emergency SLA Countdown Algorithm
 * Purpose: Monitors time elapsed since critical defect or emergency ticket is logged
 * Evaluates against predefined thresholds (e.g., 4-hour critical response window)
 */

export interface Ticket {
  id: string;
  created_at: Date;
  sla_threshold_hours: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface SLAStatus {
  status: 'BREACHED' | 'WARNING' | 'SAFE';
  escalate_to_management: boolean;
  color_flag: 'CRITICAL' | 'URGENT' | 'NORMAL';
  time_remaining_ms: number;
}

/**
 * Evaluates the SLA status of a given ticket based on its creation time and SLA threshold
 * @param ticket The ticket to evaluate
 * @returns SLAStatus with evaluation results
 */
export function evaluateSLA(ticket: Ticket): SLAStatus {
  const currentTime = new Date();
  const targetResolutionTime = new Date(ticket.created_at.getTime() + (ticket.sla_threshold_hours * 60 * 60 * 1000));
  
  const timeRemainingMs = targetResolutionTime.getTime() - currentTime.getTime();
  
  if (timeRemainingMs < 0) {
    return {
      status: 'BREACHED',
      escalate_to_management: true,
      color_flag: 'CRITICAL',
      time_remaining_ms: timeRemainingMs
    };
  } else if (timeRemainingMs <= (1 * 60 * 60 * 1000)) { // 1 hour in milliseconds
    return {
      status: 'WARNING',
      escalate_to_management: false,
      color_flag: 'URGENT',
      time_remaining_ms: timeRemainingMs
    };
  } else {
    return {
      status: 'SAFE',
      escalate_to_management: false,
      color_flag: 'NORMAL',
      time_remaining_ms: timeRemainingMs
    };
  }
}

/**
 * Calculates remaining time in human-readable format
 * @param timeRemainingMs Time remaining in milliseconds
 * @returns Human-readable time string
 */
export function formatTimeRemaining(timeRemainingMs: number): string {
  if (timeRemainingMs < 0) {
    const absTime = Math.abs(timeRemainingMs);
    const hours = Math.floor(absTime / (1000 * 60 * 60));
    const minutes = Math.floor((absTime % (1000 * 60 * 60)) / (1000 * 60));
    return `-${hours}h ${minutes}m overdue`;
  }
  
  const hours = Math.floor(timeRemainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m remaining`;
}
