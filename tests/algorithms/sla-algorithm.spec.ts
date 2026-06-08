import { test, expect } from '@playwright/test';
import { formatTimeRemaining } from '../../src/lib/algorithms/sla-algorithm.js';

test.describe('SLA Algorithm - formatTimeRemaining', () => {
  test('formats positive time remaining correctly', () => {
    // 2 hours and 30 minutes
    const ms = (2 * 60 * 60 * 1000) + (30 * 60 * 1000);
    expect(formatTimeRemaining(ms)).toBe('2h 30m remaining');
  });

  test('formats positive time remaining with zero minutes', () => {
    // 3 hours exactly
    const ms = 3 * 60 * 60 * 1000;
    expect(formatTimeRemaining(ms)).toBe('3h 0m remaining');
  });

  test('formats negative time correctly (overdue)', () => {
    // -1 hour and 15 minutes
    const ms = -((1 * 60 * 60 * 1000) + (15 * 60 * 1000));
    expect(formatTimeRemaining(ms)).toBe('-1h 15m overdue');
  });

  test('formats exactly zero time remaining', () => {
    const ms = 0;
    expect(formatTimeRemaining(ms)).toBe('0h 0m remaining');
  });
});
