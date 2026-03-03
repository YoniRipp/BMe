/**
 * Voice controller. Accepts audio (enqueues job) or transcript (sync processing).
 */
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { asyncHandler } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';
import * as voiceService from '../services/voice.js';
import { getRedisClient, isRedisConfigured } from '../redis/client.js';
import { enqueue } from '../queue/index.js';
import { sendJson, sendError } from '../utils/response.js';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
function isValidDateStr(str: string): boolean {
  if (!str || !DATE_ONLY_REGEX.test(str)) return false;
  const d = new Date(str + 'T12:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}
function isValidTimezone(tz: string): boolean {
  if (!tz || typeof tz !== 'string' || tz.length > 64) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const understand = asyncHandler(async (req: Request, res: Response) => {
  if (!config.geminiApiKey) {
    return sendError(res, 503, 'Voice service not configured (missing GEMINI_API_KEY)');
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const { audio, mimeType, transcript, lang, today, timezone } = body;
  const options: { today?: string; timezone?: string } = {};
  if (today != null && isValidDateStr(String(today))) options.today = String(today);
  if (timezone != null && isValidTimezone(String(timezone))) options.timezone = String(timezone);

  const userId = req.user?.id ?? null;

  if (audio && typeof audio === 'string' && mimeType && typeof mimeType === 'string' && mimeType.startsWith('audio/')) {
    if (!isRedisConfigured()) {
      return sendError(
        res,
        503,
        'Voice recording requires Redis. Set REDIS_URL in your backend .env (e.g. redis://localhost:6379) and restart the server. See docs or README for setup.'
      );
    }
    const jobId = randomUUID();
    const redis = await getRedisClient();
    if (!redis) {
      return sendError(res, 503, 'Redis not available');
    }
    await redis.setEx(
      `job:${jobId}`,
      300,
      JSON.stringify({ status: 'processing', createdAt: Date.now() })
    );
    await enqueue('voice.parse', {
      jobId,
      audio,
      mimeType,
      userId,
      today: options.today || new Date().toISOString().slice(0, 10),
      timezone: options.timezone || 'UTC',
    });
    return sendJson(res, {
      jobId,
      status: 'processing',
      pollUrl: `/api/jobs/${jobId}`,
    });
  }

  if (transcript && typeof transcript === 'string') {
    const text = transcript.trim();
    if (!text) return sendError(res, 400, 'Transcript is empty');
    try {
      const data = await voiceService.parseTranscript(text, (lang != null ? String(lang) : undefined) ?? 'auto', userId, options);
      return sendJson(res, data);
    } catch (e: unknown) {
      logger.error({ err: e }, 'Gemini / voice understand error');
      return sendError(res, 502, 'Failed to understand voice', { details: (e as Error)?.message ?? String(e) });
    }
  }

  return sendError(res, 400, 'Provide either audio (base64) + mimeType or transcript');
});
