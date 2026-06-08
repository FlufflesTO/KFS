import { test, expect } from '@playwright/test';
import { cleanText } from '../../src/lib/server/access.js';

test.describe('cleanText validation', () => {
  test('returns empty string if value is empty and not required', () => {
    expect(cleanText('', 'fieldName', { required: false })).toBe('');
    expect(cleanText(null, 'fieldName', { required: false })).toBe('');
    expect(cleanText(undefined, 'fieldName', { required: false })).toBe('');
  });

  test('throws if text length is less than minimum length', () => {
    expect(() => cleanText('hi', 'fieldName', { min: 3 })).toThrow('fieldName must be between 3 and 500 characters.');
    expect(() => cleanText('', 'fieldName', { required: true, min: 1 })).toThrow('fieldName must be between 1 and 500 characters.');
  });

  test('throws if text length is greater than maximum length', () => {
    expect(() => cleanText('hello', 'fieldName', { max: 4 })).toThrow('fieldName must be between 0 and 4 characters.');

    // Testing default max of 500
    const longString = 'a'.repeat(501);
    expect(() => cleanText(longString, 'fieldName')).toThrow('fieldName must be between 0 and 500 characters.');
  });

  test('trims the input text before validation', () => {
    expect(cleanText('  hello  ', 'fieldName')).toBe('hello');

    // Spaces trimmed resulting in empty string, which throws if min > 0
    expect(() => cleanText('   ', 'fieldName', { min: 1 })).toThrow('fieldName must be between 1 and 500 characters.');
  });

  test('returns the text if within min and max constraints', () => {
    expect(cleanText('hello', 'fieldName', { min: 2, max: 10 })).toBe('hello');
    // Default config works
    expect(cleanText('valid text', 'fieldName')).toBe('valid text');
  });

  test('handles numeric and boolean inputs with truthy values by converting to string', () => {
    // `value || ""` evaluates to `""` for falsy values like `false` and `0`.
    expect(cleanText(123, 'fieldName')).toBe('123');
    expect(cleanText(true, 'fieldName')).toBe('true');
  });

  test('falsy boolean and numeric values evaluate to empty string', () => {
    // `value || ""` evaluates to `""` for falsy values like `false` and `0`.
    expect(cleanText(0, 'fieldName')).toBe('');
    expect(cleanText(false, 'fieldName')).toBe('');
  });

  test('returns empty string if required is true but min is 0 (default min is 0)', () => {
    // Expected behavior based on the current implementation:
    // If required=true and min=0, an empty string passes validation
    expect(cleanText('', 'fieldName')).toBe('');
    expect(cleanText('', 'fieldName', { required: true, min: 0 })).toBe('');
  });
});
