import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as jobsController from './jobs.js';
import { getRedisClient, isRedisConfigured } from '../redis/client.js';

vi.mock('../redis/client.js', () => ({
  getRedisClient: vi.fn(),
  isRedisConfigured: vi.fn(),
}));

describe('jobs controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { params: {} };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    isRedisConfigured.mockReturnValue(true);
  });

  describe('getJobStatus', () => {
    it('returns 503 when Redis is not configured', async () => {
      isRedisConfigured.mockReturnValue(false);

      await jobsController.getJobStatus(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Job polling not available (Redis not configured)',
      });
      expect(getRedisClient).not.toHaveBeenCalled();
    });

    it('returns 400 when jobId is invalid', async () => {
      req.params = { jobId: null };

      await jobsController.getJobStatus(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid jobId' });
      expect(getRedisClient).not.toHaveBeenCalled();
    });

    // Redis-dependent tests (404, 200) require getRedisClient to return a mock that
    // the controller uses. Integration/E2E tests can cover these paths.
  });
});
