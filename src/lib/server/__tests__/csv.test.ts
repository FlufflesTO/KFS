import { describe, it, expect } from 'vitest';
import { csvEscape, rowsToCsv, parseCsv, csvObjects } from '../csv.js';

describe('CSV Utilities', () => {
  describe('csvEscape', () => {
    it('should return empty string for null or undefined', () => {
      expect(csvEscape(null)).toBe('');
      expect(csvEscape(undefined)).toBe('');
    });

    it('should return the string itself for normal strings', () => {
      expect(csvEscape('hello')).toBe('hello');
      expect(csvEscape('123')).toBe('123');
    });

    it('should quote strings containing commas', () => {
      expect(csvEscape('hello, world')).toBe('"hello, world"');
    });

    it('should quote strings containing newlines', () => {
      expect(csvEscape('hello\nworld')).toBe('"hello\nworld"');
      expect(csvEscape('hello\rworld')).toBe('"hello\rworld"');
      expect(csvEscape('hello\r\nworld')).toBe('"hello\r\nworld"');
    });

    it('should escape double quotes by doubling them and wrapping in quotes', () => {
      expect(csvEscape('hello "world"')).toBe('"hello ""world"""');
    });

    it('should prevent Excel injection by prepending tab and quoting for =, +, -, @', () => {
      expect(csvEscape('=CMD()')).toBe('"\t=CMD()"');
      expect(csvEscape('+1+2')).toBe('"\t+1+2"');
      expect(csvEscape('-1-2')).toBe('"\t-1-2"');
      expect(csvEscape('@SUM()')).toBe('"\t@SUM()"');
    });

    it('should prevent Excel injection by prepending tab and quoting for leading tabs and carriage returns', () => {
      expect(csvEscape('\tdata')).toBe('"\t\tdata"');
      expect(csvEscape('\rdata')).toBe('"\t\rdata"');
    });

    it('should handle numbers and booleans', () => {
      expect(csvEscape(123)).toBe('123');
      expect(csvEscape(true)).toBe('true');
      expect(csvEscape(false)).toBe('false');
      expect(csvEscape(0)).toBe('0');
    });

    it('should properly handle Excel injection characters that also require quotes', () => {
      expect(csvEscape('=CMD("attack")')).toBe('"\t=CMD(""attack"")"');
      expect(csvEscape('+1,2')).toBe('"\t+1,2"');
    });
  });

  describe('rowsToCsv', () => {
    it('should generate CSV with headers and rows', () => {
      const headers = ['name', 'age'];
      const rows = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }];
      const expected = 'name,age\r\nAlice,30\r\nBob,25';
      expect(rowsToCsv(headers, rows)).toBe(expected);
    });

    it('should escape values correctly in rowsToCsv', () => {
      const headers = ['name', 'description'];
      const rows = [{ name: 'Alice', description: 'Hello, World' }, { name: 'Bob', description: '=CMD()' }];
      const expected = 'name,description\r\nAlice,"Hello, World"\r\nBob,"\t=CMD()"';
      expect(rowsToCsv(headers, rows)).toBe(expected);
    });
  });

  describe('parseCsv', () => {
    it('should parse simple CSV', () => {
      const text = 'name,age\r\nAlice,30\r\nBob,25';
      const expected = [['name', 'age'], ['Alice', '30'], ['Bob', '25']];
      expect(parseCsv(text)).toEqual(expected);
    });

    it('should parse CSV with quotes and commas', () => {
      const text = 'name,description\r\nAlice,"Hello, World"\r\nBob,"\t=CMD()"';
      const expected = [['name', 'description'], ['Alice', 'Hello, World'], ['Bob', '\t=CMD()']];
      expect(parseCsv(text)).toEqual(expected);
    });

    it('should parse CSV with newlines in fields', () => {
      const text = 'name,description\r\nAlice,"Hello\nWorld"';
      const expected = [['name', 'description'], ['Alice', 'Hello\nWorld']];
      expect(parseCsv(text)).toEqual(expected);
    });

    it('should parse CSV with escaped double quotes', () => {
      const text = 'name,description\r\nAlice,"Hello ""World"""';
      const expected = [['name', 'description'], ['Alice', 'Hello "World"']];
      expect(parseCsv(text)).toEqual(expected);
    });

    it('should ignore empty rows', () => {
      const text = 'name,age\n\nAlice,30\n\n\nBob,25\n\n';
      const expected = [['name', 'age'], ['Alice', '30'], ['Bob', '25']];
      expect(parseCsv(text)).toEqual(expected);
    });
  });

  describe('csvObjects', () => {
    it('should convert CSV text to objects', () => {
      const text = 'name,age\r\nAlice,30\r\nBob,25';
      const expectedHeaders = ['name', 'age'];
      const expected = [
        { rowNumber: 2, data: { name: 'Alice', age: '30' } },
        { rowNumber: 3, data: { name: 'Bob', age: '25' } }
      ];
      expect(csvObjects(text, expectedHeaders)).toEqual(expected);
    });

    it('should throw error if header is missing or mismatch', () => {
      const text = 'name,age\r\nAlice,30\r\nBob,25';
      expect(() => csvObjects(text, ['name', 'year'])).toThrowError('CSV header must be exactly: name,year');
    });

    it('should throw error if missing data rows', () => {
      const text = 'name,age';
      expect(() => csvObjects(text, ['name', 'age'])).toThrowError('CSV must include a header row and at least one data row.');
    });

    it('should trim headers and values', () => {
      const text = ' name , age \r\n Alice , 30 \r\n Bob , 25 ';
      const expectedHeaders = ['name', 'age'];
      const expected = [
        { rowNumber: 2, data: { name: 'Alice', age: '30' } },
        { rowNumber: 3, data: { name: 'Bob', age: '25' } }
      ];
      expect(csvObjects(text, expectedHeaders)).toEqual(expected);
    });
  });
});
