import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { evaluateSLA, formatTimeRemaining, type Ticket } from '../sla-algorithm';

describe('SLA Algorithm', () => {
  beforeEach(() => {
    // Tell vitest we use mocked time
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restoring date after each test run
    vi.useRealTimers();
  });

  describe('evaluateSLA', () => {
    it('returns SAFE when more than 1 hour remains', () => {
      // Current time is exactly 2023-01-01T12:00:00Z
      const now = new Date('2023-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const ticket: Ticket = {
        id: '1',
        // Created 1 hour ago
        created_at: new Date('2023-01-01T11:00:00Z'),
        // Threshold is 4 hours, so due at 15:00:00Z (3 hours from now)
        sla_threshold_hours: 4,
        priority: 'critical'
      };

      const result = evaluateSLA(ticket);

      expect(result.status).toBe('SAFE');
      expect(result.escalate_to_management).toBe(false);
      expect(result.color_flag).toBe('NORMAL');
      expect(result.time_remaining_ms).toBe(3 * 60 * 60 * 1000); // 3 hours
    });

    it('returns WARNING when 1 hour or less remains', () => {
      const now = new Date('2023-01-01T14:30:00Z');
      vi.setSystemTime(now);

      const ticket: Ticket = {
        id: '2',
        // Created 3.5 hours ago
        created_at: new Date('2023-01-01T11:00:00Z'),
        // Threshold is 4 hours, due at 15:00:00Z (30 mins from now)
        sla_threshold_hours: 4,
        priority: 'high'
      };

      const result = evaluateSLA(ticket);

      expect(result.status).toBe('WARNING');
      expect(result.escalate_to_management).toBe(false);
      expect(result.color_flag).toBe('URGENT');
      expect(result.time_remaining_ms).toBe(30 * 60 * 1000); // 30 mins
    });

    it('returns WARNING when exactly 1 hour remains', () => {
      const now = new Date('2023-01-01T14:00:00Z');
      vi.setSystemTime(now);

      const ticket: Ticket = {
        id: '2',
        // Created 3 hours ago
        created_at: new Date('2023-01-01T11:00:00Z'),
        // Threshold is 4 hours, due at 15:00:00Z (1 hour from now)
        sla_threshold_hours: 4,
        priority: 'high'
      };

      const result = evaluateSLA(ticket);

      expect(result.status).toBe('WARNING');
      expect(result.escalate_to_management).toBe(false);
      expect(result.color_flag).toBe('URGENT');
      expect(result.time_remaining_ms).toBe(1 * 60 * 60 * 1000); // 1 hour
    });

    it('returns BREACHED when time has expired', () => {
      const now = new Date('2023-01-01T16:00:00Z');
      vi.setSystemTime(now);

      const ticket: Ticket = {
        id: '3',
        // Created 5 hours ago
        created_at: new Date('2023-01-01T11:00:00Z'),
        // Threshold is 4 hours, due at 15:00:00Z (expired 1 hour ago)
        sla_threshold_hours: 4,
        priority: 'critical'
      };

      const result = evaluateSLA(ticket);

      expect(result.status).toBe('BREACHED');
      expect(result.escalate_to_management).toBe(true);
      expect(result.color_flag).toBe('CRITICAL');
      expect(result.time_remaining_ms).toBe(-1 * 60 * 60 * 1000); // -1 hour
    });
  });

  describe('formatTimeRemaining', () => {
    it('formats positive time remaining correctly', () => {
      // 2 hours, 15 minutes in ms
      const ms = (2 * 60 * 60 * 1000) + (15 * 60 * 1000);
      expect(formatTimeRemaining(ms)).toBe('2h 15m remaining');
    });

    it('formats negative time remaining correctly', () => {
      // -1 hour, 30 minutes in ms
      const ms = -((1 * 60 * 60 * 1000) + (30 * 60 * 1000));
      expect(formatTimeRemaining(ms)).toBe('-1h 30m overdue');
    });

    it('formats zero time remaining correctly', () => {
      expect(formatTimeRemaining(0)).toBe('0h 0m remaining');
    });
  });
});
