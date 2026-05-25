/**
 * Dispatch Calendar Component - Gantt/Timeline View
 * 
 * Visual scheduling timeline for technician job dispatch.
 * Replaces list view with interactive calendar showing:
 * - Technician availability across days/weeks
 * - Job blocks with duration estimates
 * - Emergency job highlighting
 * - Drag-and-drop rescheduling (via JS integration)
 * - SLA countdown indicators
 * 
 * Usage: Import in /portal/admin/dispatch.astro
 */

// ============================================================================
// CALENDAR DATA STRUCTURES
// ============================================================================

/**
 * Generate calendar data for dispatch view
 * @param {Array} jobs - Array of job objects with scheduled_date, assigned_technician_id, etc.
 * @param {Array} technicians - Array of technician objects with id, name
 * @param {string} startDate - ISO date string for calendar start (Monday of current week)
 * @param {number} daysToShow - Number of days to display (default: 7 for week view)
 */
export function generateCalendarData(jobs, technicians, startDate, daysToShow = 7) {
  const start = new Date(startDate);
  const dates = [];
  
  // Generate date range
  for (let i = 0; i < daysToShow; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    dates.push({
      iso: date.toISOString().split('T')[0],
      display: date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }),
      dayOfWeek: date.getDay(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    });
  }

  // Build technician schedule matrix
  const schedule = technicians.map(tech => {
    const techJobs = jobs.filter(j => j.assigned_technician_id === tech.id);
    
    const slots = dates.map(date => {
      const dayJobs = techJobs.filter(j => j.scheduled_date === date.iso);
      
      return {
        date: date.iso,
        display: date.display,
        isWeekend: date.isWeekend,
        jobs: dayJobs.map(job => ({
          id: job.id,
          jobType: job.job_type,
          priority: job.priority,
          isEmergency: job.is_emergency === 1,
          status: job.status,
          systemType: job.system_type,
          coverageArea: job.coverage_area,
          ownerCompanyName: job.owner_company_name,
          physicalAddress: job.physical_address,
          scheduledDate: job.scheduled_date,
          estimatedDuration: job.estimated_duration_minutes || 60,
          requiredByDate: job.required_by_date,
          slaInfo: calculateSlaInfo(job.required_by_date),
          priorityClass: getPriorityClass(job.priority),
          statusClass: getStatusClass(job.status)
        }))
      };
    });

    return {
      technician: tech,
      slots
    };
  });

  // Calculate summary stats
  const stats = {
    totalJobs: jobs.length,
    unassigned: jobs.filter(j => !j.assigned_technician_id).length,
    emergencyCount: jobs.filter(j => j.is_emergency === 1).length,
    slaWarning: jobs.filter(j => {
      const sla = calculateSlaInfo(j.required_by_date);
      return sla.daysUntil <= 3 && sla.daysUntil >= 0;
    }).length,
    weekendJobs: jobs.filter(j => {
      const jobDate = new Date(j.scheduled_date);
      return jobDate.getDay() === 0 || jobDate.getDay() === 6;
    }).length
  };

  return {
    dates,
    schedule,
    stats,
    startDate: start.toISOString().split('T')[0],
    endDate: dates[dates.length - 1].iso
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateSlaInfo(requiredByDate) {
  if (!requiredByDate) {
    return { text: '—', daysUntil: null, class: 'text-kharon-grey' };
  }
  
  const required = new Date(requiredByDate + 'T00:00:00Z');
  const now = new Date();
  const msDiff = required.getTime() - now.getTime();
  const days = Math.ceil(msDiff / 86400000);
  
  if (days < 0) {
    return { text: `${-days}d overdue`, daysUntil: days, class: 'text-kharon-red font-bold' };
  }
  if (days <= 3) {
    return { text: `${days}d`, daysUntil: days, class: 'text-amber-700 font-semibold' };
  }
  return { text: `${days}d`, daysUntil: days, class: 'text-emerald-700' };
}

function getPriorityClass(priority) {
  switch (priority) {
    case 'Critical': return 'bg-kharon-red text-white';
    case 'High': return 'border border-amber-400 bg-amber-50 text-amber-800';
    case 'Low': return 'border border-kharon-border bg-white text-kharon-grey';
    default: return 'bg-kharon-light text-kharon-grey';
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'In Progress': return 'border-l-4 border-blue-500';
    case 'Completed': return 'border-l-4 border-green-500 opacity-60';
    case 'Scheduled': return 'border-l-4 border-kharon-blue';
    default: return 'border-l-4 border-grey-400';
  }
}

/**
 * Get time slot width based on estimated duration
 * Assuming 8-hour work day (480 minutes) represented in calendar cell
 */
export function getJobBlockWidth(durationMinutes, cellWidthPx = 120) {
  const workDayMinutes = 480;
  const ratio = Math.min(durationMinutes / workDayMinutes, 1);
  return Math.max(Math.round(cellWidthPx * ratio), 20); // Minimum 20px width
}

/**
 * Calculate overlapping jobs for same technician on same day
 * Returns vertical positioning for each job block
 */
export function calculateJobPositions(dayJobs, maxCellHeight = 200) {
  if (!dayJobs.length) return [];

  // Sort by duration (longer jobs first for better packing)
  const sorted = [...dayJobs].sort((a, b) => b.estimatedDuration - a.estimatedDuration);
  
  const positions = [];
  const rows = []; // Track end time of each row
  
  for (const job of sorted) {
    const durationHours = job.estimatedDuration / 60;
    
    // Find first available row
    let rowIndex = 0;
    while (rowIndex < rows.length && rows[rowIndex] > 8) { // 8-hour day limit
      rowIndex++;
    }
    
    if (rowIndex >= rows.length) {
      rows.push(durationHours);
    } else {
      rows[rowIndex] += durationHours;
    }
    
    positions.push({
      jobId: job.id,
      row: rowIndex,
      top: rowIndex * 50 + 4, // 50px per row + padding
      height: Math.min(durationHours * 40, maxCellHeight - 8) // 40px per hour
    });
  }
  
  // Map back to original job order
  return dayJobs.map(job => {
    const pos = positions.find(p => p.jobId === job.id);
    return pos || { jobId: job.id, row: 0, top: 4, height: 40 };
  });
}

/**
 * Generate HTML for calendar grid
 * This can be used in Astro templates or rendered client-side
 */
export function renderCalendarGrid(calendarData, options = {}) {
  const {
    showWeekends = true,
    showUnassigned = false,
    cellWidth = 140,
    rowHeight = 280
  } = options;

  let html = `<div class="dispatch-calendar overflow-x-auto">`;
  
  // Header row with dates
  html += `<div class="calendar-header flex border-b border-kharon-border sticky top-0 bg-white z-10">`;
  html += `<div class="technician-header w-48 flex-shrink-0 p-3 font-semibold text-kharon-blue border-r">Technician</div>`;
  
  calendarData.dates.forEach((date, index) => {
    const isToday = date.iso === new Date().toISOString().split('T')[0];
    const bgClass = isToday ? 'bg-kharon-blue text-white' : (date.isWeekend && !showWeekends ? 'bg-grey-50' : 'bg-white');
    const displayClass = date.isWeekend ? 'text-kharon-grey' : 'text-kharon-dark';
    
    html += `
      <div class="date-cell w-[${cellWidth}px] flex-shrink-0 p-2 text-center border-r ${bgClass} ${displayClass}">
        <div class="text-xs uppercase">${date.display.split(' ')[0]}</div>
        <div class="text-lg font-bold">${date.display.split(' ')[1]}</div>
        <div class="text-xs">${date.display.split(' ')[2]}</div>
      </div>
    `;
  });
  
  html += `</div>`;

  // Technician rows
  calendarData.schedule.forEach(techSchedule => {
    html += `<div class="technician-row flex border-b border-kharon-border hover:bg-kharon-light/30 transition-colors">`;
    html += `
      <div class="technician-info w-48 flex-shrink-0 p-3 border-r border-kharon-border">
        <div class="font-medium text-kharon-blue">${techSchedule.technician.name}</div>
        <div class="text-xs text-kharon-grey mt-1">
          ${techSchedule.slots.reduce((total, slot) => total + slot.jobs.length, 0)} jobs this week
        </div>
      </div>
    `;

    // Date cells with jobs
    techSchedule.slots.forEach((slot, slotIndex) => {
      if (slot.isWeekend && !showWeekends) {
        html += `<div class="weekend-cell w-[${cellWidth}px] flex-shrink-0 bg-grey-50 border-r"></div>`;
        return;
      }

      const positions = calculateJobPositions(slot.jobs);
      
      html += `
        <div class="job-cell w-[${cellWidth}px] flex-shrink-0 border-r relative p-1 min-h-[${rowHeight}px] ${slot.isWeekend ? 'bg-grey-50' : 'bg-white'}">
      `;

      slot.jobs.forEach((job, jobIndex) => {
        const pos = positions[jobIndex];
        const width = getJobBlockWidth(job.estimatedDuration, cellWidth - 8);
        
        html += `
          <div class="job-block absolute left-1 rounded shadow-sm p-2 text-xs cursor-pointer hover:shadow-md transition-shadow ${job.priorityClass} ${job.statusClass}"
               style="top: ${pos.top}px; width: ${width}px;"
               data-job-id="${job.id}"
               data-technician-id="${techSchedule.technician.id}"
               data-date="${slot.date}">
            <div class="font-semibold truncate">${job.ownerCompanyName}</div>
            <div class="truncate opacity-80">${job.systemType}</div>
            <div class="flex items-center gap-1 mt-1">
              <span class="text-[10px]">${job.estimatedDuration}m</span>
              ${job.isEmergency ? '<span class="text-[10px] text-kharon-red font-bold">⚠ EMERGENCY</span>' : ''}
            </div>
            ${job.slaInfo.daysUntil !== null && job.slaInfo.daysUntil <= 3 ? `
              <div class="mt-1 text-[10px] ${job.slaInfo.class}">SLA: ${job.slaInfo.text}</div>
            ` : ''}
          </div>
        `;
      });

      html += `</div>`;
    });

    html += `</div>`;
  });

  // Unassigned jobs section (optional)
  if (showUnassigned && calendarData.stats.unassigned > 0) {
    const unassignedJobs = calendarData.schedule[0]?.slots[0]?.jobs.filter(j => !j.assigned_technician_id) || [];
    
    html += `<div class="unassigned-section mt-4 p-4 bg-amber-50 border border-amber-200 rounded">`;
    html += `<h3 class="font-semibold text-amber-800 mb-2">Unassigned Jobs (${calendarData.stats.unassigned})</h3>`;
    html += `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">`;
    
    unassignedJobs.forEach(job => {
      html += `
        <div class="unassigned-job p-3 bg-white rounded border border-amber-200 shadow-sm" data-job-id="${job.id}">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-medium text-kharon-blue">${job.ownerCompanyName}</div>
              <div class="text-xs text-kharon-grey">${job.physicalAddress?.slice(0, 50)}...</div>
              <div class="text-xs mt-1">
                <span class="${job.priorityClass} px-2 py-0.5 rounded text-[10px]">${job.priority}</span>
                ${job.isEmergency ? '<span class="ml-1 text-kharon-red text-[10px] font-bold">EMERGENCY</span>' : ''}
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-kharon-grey">${job.scheduled_date}</div>
              <div class="text-xs ${job.slaInfo.class}">${job.slaInfo.text}</div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += `</div></div>`;
  }

  html += `</div>`;
  
  return html;
}

/**
 * Generate ICS calendar export for technicians
 * Allows exporting scheduled jobs to Outlook/Google Calendar
 */
export function generateIcsExport(jobs, technicianName) {
  const events = jobs.map(job => {
    const startDate = job.scheduled_date.replace(/-/g, '') + 'T080000Z';
    const endDate = job.scheduled_date.replace(/-/g, '') + 'T170000Z';
    const uid = `job-${job.id}@kharon.co.za`;
    
    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${job.job_type} - ${job.ownerCompanyName}`,
      `DESCRIPTION:${job.system_type} - ${job.coverage_area}\\nAddress: ${job.physical_address}`,
      `LOCATION:${job.physical_address}`,
      `STATUS:${job.status === 'Completed' ? 'COMPLETED' : 'CONFIRMED'}`,
      `PRIORITY:${job.priority === 'Critical' ? '1' : job.priority === 'High' ? '2' : '5'}`,
      'END:VEVENT'
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kharon FSM//Dispatch Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Kharon Dispatch - ${technicianName}`,
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');
}

export default {
  generateCalendarData,
  getJobBlockWidth,
  calculateJobPositions,
  renderCalendarGrid,
  generateIcsExport
};
