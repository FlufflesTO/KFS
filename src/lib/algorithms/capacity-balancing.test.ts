import { describe, it, expect } from 'vitest';
import { findAvailableSlots, Technician, ScheduledJob } from './capacity-balancing';

describe('capacity-balancing', () => {
  describe('findAvailableSlots', () => {
    const createTechnician = (overrides: Partial<Technician> = {}): Technician => ({
      id: 'tech-1',
      name: 'John Doe',
      credentials: ['F1', 'F2'],
      daily_queue: [],
      max_daily_capacity: 8,
      current_availability: true,
      ...overrides,
    });

    const createJob = (estimated_hours: number, travel_time: number = 0): ScheduledJob => ({
      id: Math.random().toString(36).substring(7),
      estimated_hours,
      travel_time,
      saqcc_codes: [],
      date: new Date(),
    });

    it('should return a slot when remaining capacity is greater than job duration', () => {
      const tech = createTechnician({ max_daily_capacity: 8, daily_queue: [createJob(2, 1)] }); // Load: 3, Remaining: 5
      const slots = findAvailableSlots(tech, 4);
      expect(slots).toHaveLength(1);
      expect(slots[0]).toBeInstanceOf(Date);
    });

    it('should return a slot when remaining capacity exactly equals job duration', () => {
      const tech = createTechnician({ max_daily_capacity: 8, daily_queue: [createJob(4, 0)] }); // Load: 4, Remaining: 4
      const slots = findAvailableSlots(tech, 4);
      expect(slots).toHaveLength(1);
      expect(slots[0]).toBeInstanceOf(Date);
    });

    it('should return an empty array when remaining capacity is less than job duration', () => {
      const tech = createTechnician({ max_daily_capacity: 8, daily_queue: [createJob(6, 0)] }); // Load: 6, Remaining: 2
      const slots = findAvailableSlots(tech, 4);
      expect(slots).toHaveLength(0);
    });

    it('should return a slot when technician daily queue is empty', () => {
      const tech = createTechnician({ max_daily_capacity: 8, daily_queue: [] }); // Load: 0, Remaining: 8
      const slots = findAvailableSlots(tech, 8);
      expect(slots).toHaveLength(1);
      expect(slots[0]).toBeInstanceOf(Date);
    });

    it('should return an empty array when max daily capacity is 0', () => {
      const tech = createTechnician({ max_daily_capacity: 0, daily_queue: [] }); // Load: 0, Remaining: 0
      const slots = findAvailableSlots(tech, 2);
      expect(slots).toHaveLength(0);
    });

    it('should calculate daily load with travel time', () => {
      const tech = createTechnician({ max_daily_capacity: 8, daily_queue: [createJob(2, 2)] }); // Load: 4, Remaining: 4
      const slots = findAvailableSlots(tech, 5); // Needs 5, has 4
      expect(slots).toHaveLength(0);
    });

    it('should return an empty array when remaining capacity is negative', () => {
       const tech = createTechnician({ max_daily_capacity: 8, daily_queue: [createJob(10, 0)] }); // Load: 10, Remaining: -2
       const slots = findAvailableSlots(tech, 2);
       expect(slots).toHaveLength(0);
    });
  });
});
