/**
 * Voice controller.
 */
import { asyncHandler } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';
import * as voiceService from '../services/voice.js';
import { sendJson, sendError } from '../utils/response.js';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
function isValidDateStr(str) {
  if (!str || !DATE_ONLY_REGEX.test(str)) return false;
  const d = new Date(str + 'T12:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}
function isValidTimezone(tz) {
  if (!tz || typeof tz !== 'string' || tz.length > 64) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const understand = asyncHandler(async (req, res) => {
  if (!config.geminiApiKey) {
    return sendError(res, 503, 'Voice service not configured (missing GEMINI_API_KEY)');
  }
  const { transcript, lang, today, timezone } = req.body ?? {};
  if (!transcript || typeof transcript !== 'string') {
    return sendError(res, 400, 'Missing or invalid transcript');
  }
  const text = transcript.trim();
  if (!text) {
    return sendError(res, 400, 'Transcript is empty');
  }
  const options = {};
  if (today != null && isValidDateStr(today)) options.today = today;
  if (timezone != null && isValidTimezone(timezone)) options.timezone = timezone;
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'voice.js controller:options', message: 'voice options from body', data: { bodyToday: today, bodyTimezone: timezone, validToday: !!options.today, validTz: !!options.timezone, optionsToday: options.today, optionsTimezone: options.timezone }, timestamp: Date.now(), hypothesisId: 'H1' }) }).catch(() => {});
  // #endregion
  try {
    const userId = req.user?.id ?? null;
    const { actions } = await voiceService.parseTranscript(text, lang ?? 'auto', userId, options);
    sendJson(res, { actions });
  } catch (e) {
    console.error('Gemini / voice understand error:', e?.message ?? e);
    sendError(res, 502, 'Failed to understand voice', { details: e?.message ?? String(e) });
  }
});
