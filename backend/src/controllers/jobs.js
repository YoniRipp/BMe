/**
 * Job status polling controller.
 */
import { asyncHandler } from '../middleware/errorHandler.js';
import { getRedisClient, isRedisConfigured } from '../redis/client.js';
import { sendJson, sendError } from '../utils/response.js';

export const getJobStatus = asyncHandler(async (req, res) => {
  if (!isRedisConfigured()) {
    return sendError(res, 503, 'Job polling not available (Redis not configured)');
  }

  const { jobId } = req.params;

  if (!jobId || typeof jobId !== 'string') {
    return sendError(res, 400, 'Invalid jobId');
  }

  const redis = await getRedisClient();
  const data = await redis.get(`job:${jobId}`);

  if (!data) {
    return sendError(res, 404, 'Job not found or expired');
  }

  sendJson(res, JSON.parse(data));
});
