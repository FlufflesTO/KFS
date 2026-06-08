import { test, expect } from '@playwright/test';
import { calculateOptimalTechnician, JobRequirements, Technician } from '../src/lib/algorithms/capacity-balancing';

test.describe('calculateOptimalTechnician', () => {
  test('returns null when no technicians are available', () => {
    const job: JobRequirements = {
      estimated_hours: 2,
      saqcc_codes: ['A1'],
      travel_time: 1
    };
    expect(calculateOptimalTechnician(job, [])).toBeNull();
  });

  test('returns null when technicians do not have required certifications', () => {
    const job: JobRequirements = {
      estimated_hours: 2,
      saqcc_codes: ['A1', 'B2'],
      travel_time: 1
    };
    const techs: Technician[] = [
      {
        id: 't1',
        name: 'Tech 1',
        credentials: ['A1'],
        daily_queue: [],
        max_daily_capacity: 8,
        current_availability: true
      }
    ];
    expect(calculateOptimalTechnician(job, techs)).toBeNull();
  });

  test('returns null when technicians are not currently available', () => {
    const job: JobRequirements = {
      estimated_hours: 2,
      saqcc_codes: ['A1'],
      travel_time: 1
    };
    const techs: Technician[] = [
      {
        id: 't1',
        name: 'Tech 1',
        credentials: ['A1'],
        daily_queue: [],
        max_daily_capacity: 8,
        current_availability: false
      }
    ];
    expect(calculateOptimalTechnician(job, techs)).toBeNull();
  });

  test('returns null when job duration exceeds max capacity', () => {
    const job: JobRequirements = {
      estimated_hours: 8,
      saqcc_codes: ['A1'],
      travel_time: 1 // total 9 hours
    };
    const techs: Technician[] = [
      {
        id: 't1',
        name: 'Tech 1',
        credentials: ['A1'],
        daily_queue: [],
        max_daily_capacity: 8,
        current_availability: true
      }
    ];
    expect(calculateOptimalTechnician(job, techs)).toBeNull();
  });

  test('returns technician with lowest current load when multiple are eligible', () => {
    const job: JobRequirements = {
      estimated_hours: 2,
      saqcc_codes: ['A1'],
      travel_time: 1 // total 3 hours
    };
    const techs: Technician[] = [
      {
        id: 't1',
        name: 'Tech 1',
        credentials: ['A1', 'B2'],
        daily_queue: [
          { id: 'j1', estimated_hours: 2, travel_time: 1, saqcc_codes: ['A1'], date: new Date() } // load: 3
        ],
        max_daily_capacity: 8,
        current_availability: true
      },
      {
        id: 't2',
        name: 'Tech 2',
        credentials: ['A1'],
        daily_queue: [
          { id: 'j2', estimated_hours: 1, travel_time: 0, saqcc_codes: ['A1'], date: new Date() } // load: 1
        ],
        max_daily_capacity: 8,
        current_availability: true
      }
    ];

    const result = calculateOptimalTechnician(job, techs);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('t2'); // t2 has load 1 vs t1 has load 3
  });

  test('selects technician with exact matching certifications', () => {
    const job: JobRequirements = {
      estimated_hours: 2,
      saqcc_codes: ['A1', 'B2'],
      travel_time: 0
    };
    const techs: Technician[] = [
      {
        id: 't1',
        name: 'Tech 1',
        credentials: ['A1'],
        daily_queue: [],
        max_daily_capacity: 8,
        current_availability: true
      },
      {
        id: 't2',
        name: 'Tech 2',
        credentials: ['A1', 'B2', 'C3'],
        daily_queue: [],
        max_daily_capacity: 8,
        current_availability: true
      }
    ];
    const result = calculateOptimalTechnician(job, techs);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('t2');
  });
});
