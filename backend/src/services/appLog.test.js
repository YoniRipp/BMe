import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAction, logError, listLogs } from './appLog.js';

vi.mock('../db/index.js', () => ({
  getPool: vi.fn(),
  isDbConfigured: vi.fn(),
}));

import { getPool, isDbConfigured } from '../db/index.js';

describe('appLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logAction', () => {
    it('returns without throwing when db is not configured', async () => {
      isDbConfigured.mockReturnValue(false);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await expect(logAction('test action')).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('[appLog action]', 'test action', '');
      consoleSpy.mockRestore();
    });

    it('inserts into DB when configured', async () => {
      isDbConfigured.mockReturnValue(true);
      const mockQuery = vi.fn().mockResolvedValue({});
      getPool.mockReturnValue({ query: mockQuery });

      await logAction('user created', { userId: '123' }, 'admin-id');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO app_logs'),
        ['action', 'user created', '{"userId":"123"}', 'admin-id']
      );
    });
  });

  describe('logError', () => {
    it('returns without throwing when db is not configured', async () => {
      isDbConfigured.mockReturnValue(false);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await expect(logError('parse failed')).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('[appLog error]', 'parse failed', '');
      consoleSpy.mockRestore();
    });

    it('inserts into DB when configured', async () => {
      isDbConfigured.mockReturnValue(true);
      const mockQuery = vi.fn().mockResolvedValue({});
      getPool.mockReturnValue({ query: mockQuery });

      await logError('voice fallback', { raw: 'x' }, 'user-1');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO app_logs'),
        ['error', 'voice fallback', '{"raw":"x"}', 'user-1']
      );
    });
  });

  describe('listLogs', () => {
    it('returns empty array when db is not configured', async () => {
      isDbConfigured.mockReturnValue(false);
      const result = await listLogs('action');
      expect(result).toEqual([]);
      expect(getPool).not.toHaveBeenCalled();
    });

    it('returns rows when db is configured', async () => {
      isDbConfigured.mockReturnValue(true);
      const rows = [
        { id: '1', level: 'action', message: 'test', details: null, userId: 'u1', createdAt: '2025-01-01T00:00:00Z' },
      ];
      getPool.mockReturnValue({ query: vi.fn().mockResolvedValue({ rows }) });

      const result = await listLogs('action');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: '1', level: 'action', message: 'test' });
    });
  });
});
