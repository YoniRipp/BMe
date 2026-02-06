/**
 * Voice controller.
 */
import { asyncHandler } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';
import * as voiceService from '../services/voice.js';
import { sendJson, sendError } from '../utils/response.js';

export const understand = asyncHandler(async (req, res) => {
  if (!config.geminiApiKey) {
    return sendError(res, 503, 'Voice service not configured (missing GEMINI_API_KEY)');
  }
  const { transcript, lang } = req.body ?? {};
  if (!transcript || typeof transcript !== 'string') {
    return sendError(res, 400, 'Missing or invalid transcript');
  }
  const text = transcript.trim();
  if (!text) {
    return sendError(res, 400, 'Transcript is empty');
  }
  try {
    const { actions } = await voiceService.parseTranscript(text, lang ?? 'auto');
    sendJson(res, { actions });
  } catch (e) {
    console.error('Gemini / voice understand error:', e?.message ?? e);
    sendError(res, 502, 'Failed to understand voice', { details: e?.message ?? String(e) });
  }
});
