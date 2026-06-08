import { test, expect } from '@playwright/test';
import { cleanEmail } from '../../src/lib/server/access.js';

test.describe('cleanEmail', () => {
  test('should return lowercase trimmed email', () => {
    expect(cleanEmail(' TEST@Example.com ', 'email')).toBe('test@example.com');
  });

  test('should pass valid standard emails', () => {
    expect(cleanEmail('valid.email+test@domain.co.uk', 'email')).toBe('valid.email+test@domain.co.uk');
  });

  test('should throw Error for empty email if required is true (default)', () => {
    expect(() => cleanEmail('', 'email')).toThrowError('email must be a valid email address.');
    expect(() => cleanEmail('   ', 'email')).toThrowError('email must be a valid email address.');
  });

  test('should return null for empty email if required is false', () => {
    expect(cleanEmail('', 'email', { required: false })).toBeNull();
    expect(cleanEmail('   ', 'email', { required: false })).toBeNull();
  });

  test('should throw Error for invalid email structures', () => {
    expect(() => cleanEmail('notanemail', 'email')).toThrowError('email must be a valid email address.');
    expect(() => cleanEmail('missing@domain', 'email')).toThrowError('email must be a valid email address.');
    expect(() => cleanEmail('@missingusername.com', 'email')).toThrowError('email must be a valid email address.');
    expect(() => cleanEmail('spaces in@email.com', 'email')).toThrowError('email must be a valid email address.');
  });

  test('should handle non-string inputs by converting them to string', () => {
    // Testing specific behavior in the function: String(value || "")
    expect(() => cleanEmail(123, 'email')).toThrowError('email must be a valid email address.');
  });

  test('should throw Error for emails longer than 160 characters', () => {
    const longEmail = 'a'.repeat(150) + '@example.com';
    expect(() => cleanEmail(longEmail, 'email')).toThrowError('email must be a valid email address.');
  });
});
