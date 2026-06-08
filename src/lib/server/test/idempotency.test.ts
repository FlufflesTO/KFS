import { describe, it, expect, vi } from 'vitest';
import { startIdempotentMutation, finishIdempotentMutation, requestHash } from '../idempotency.js';

describe('Idempotency System', () => {
  describe('requestHash', () => {
    it('should generate a consistent hash for a given string', async () => {
      const hash1 = await requestHash('test body');
      const hash2 = await requestHash('test body');
      expect(hash1).toBe(hash2);
    });

    it('should generate a consistent hash for null/undefined by treating them as empty strings', async () => {
      const emptyHash = await requestHash('');
      const nullHash = await requestHash(null);
      const undefinedHash = await requestHash(undefined);

      expect(nullHash).toBe(emptyHash);
      expect(undefinedHash).toBe(emptyHash);
    });
  });

  describe('startIdempotentMutation', () => {
    it('should return new state when idempotency key does not exist', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({}),
      } as any;

      const result = await startIdempotentMutation(mockDb, {
        idempotencyKey: 'test-key',
        mutationType: 'queued_request',
        targetPath: '/api/test',
        body: 'test body',
        user: { id: 'user-1', role: 'admin', name: 'Test User', email: 'test@example.com' } as any,
      });

      expect(result.state).toBe('new');
      expect(result.id).toBeDefined();
      expect(mockDb.prepare).toHaveBeenCalledTimes(2);
      expect(mockDb.first).toHaveBeenCalledTimes(1);
      expect(mockDb.run).toHaveBeenCalledTimes(1);
    });

    it('should return duplicate state when idempotency key exists with same hash', async () => {
      const body = 'test body';
      const hash = await requestHash(body);
      const existingRecord = {
        id: 'existing-id',
        idempotency_key: 'test-key',
        request_hash: hash,
        status: 'accepted',
        response_status: null,
      };

      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(existingRecord),
      } as any;

      const result = await startIdempotentMutation(mockDb, {
        idempotencyKey: 'test-key',
        mutationType: 'queued_request',
        targetPath: '/api/test',
        body,
        user: { id: 'user-1', role: 'admin', name: 'Test User', email: 'test@example.com' } as any,
      });

      expect(result.state).toBe('duplicate');
      expect(result.id).toBe('existing-id');
      expect(result.record).toEqual(existingRecord);
      expect(mockDb.prepare).toHaveBeenCalledTimes(1);
    });

    it('should return conflict state and update record when idempotency key exists with different hash', async () => {
      const body = 'test body';
      const existingRecord = {
        id: 'existing-id',
        idempotency_key: 'test-key',
        request_hash: 'different-hash',
        status: 'accepted',
        response_status: null,
      };

      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(existingRecord),
        run: vi.fn().mockResolvedValue({}),
      } as any;

      const result = await startIdempotentMutation(mockDb, {
        idempotencyKey: 'test-key',
        mutationType: 'queued_request',
        targetPath: '/api/test',
        body,
        user: { id: 'user-1', role: 'admin', name: 'Test User', email: 'test@example.com' } as any,
      });

      expect(result.state).toBe('conflict');
      expect(result.id).toBe('existing-id');
      expect(result.record).toEqual(existingRecord);
      expect(mockDb.prepare).toHaveBeenCalledTimes(2);
      expect(mockDb.run).toHaveBeenCalledTimes(1);
    });
  });

  describe('finishIdempotentMutation', () => {
    it('should update the record with applied status and response status', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({}),
      } as any;

      await finishIdempotentMutation(mockDb, 'test-id', 'applied', 200);

      expect(mockDb.prepare).toHaveBeenCalledTimes(1);
      expect(mockDb.bind).toHaveBeenCalledWith('applied', 200, null, 'test-id');
      expect(mockDb.run).toHaveBeenCalledTimes(1);
    });

    it('should update the record with failed status, response status, and conflict reason', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({}),
      } as any;

      await finishIdempotentMutation(mockDb, 'test-id', 'failed', 400, 'Bad Request');

      expect(mockDb.prepare).toHaveBeenCalledTimes(1);
      expect(mockDb.bind).toHaveBeenCalledWith('failed', 400, 'Bad Request', 'test-id');
      expect(mockDb.run).toHaveBeenCalledTimes(1);
    });
  });
});
