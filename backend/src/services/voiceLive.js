/**
 * Gemini Live API session: WebSocket bridge for real-time voice.
 * Forwards client audio to Gemini Live and Live audio/responses to client.
 * Handles tool calls (add_food, add_schedule, etc.) and persists to DB.
 */
import { GoogleGenAI, Modality } from '@google/genai';
import waveResampler from 'wave-resampler';
import { config } from '../config/index.js';
import { isDbConfigured } from '../db/index.js';
import { VOICE_PROMPT, HANDLERS } from './voice.js';
import { VOICE_TOOLS } from '../../voice/tools.js';
import * as foodEntryService from './foodEntry.js';
import * as scheduleService from './schedule.js';
import * as transactionService from './transaction.js';
import * as workoutService from './workout.js';
import * as dailyCheckInService from './dailyCheckIn.js';
import * as goalService from './goal.js';

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const TARGET_SAMPLE_RATE = 16000;

/**
 * Resample 16-bit PCM from one sample rate to 16000 Hz. Returns base64 string of 16-bit PCM at 16 kHz.
 * @param {string} base64Pcm - Base64-encoded 16-bit PCM
 * @param {number} fromRate - Source sample rate (e.g. 48000)
 * @returns {string} Base64-encoded 16-bit PCM at 16000 Hz
 */
function resampleTo16k(base64Pcm, fromRate) {
  if (fromRate === TARGET_SAMPLE_RATE) return base64Pcm;
  const buf = Buffer.from(base64Pcm, 'base64');
  const int16 = new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2);
  const floatSamples = Array.from(int16, (s) => s / 32768);
  const resampled = waveResampler.resample(floatSamples, fromRate, TARGET_SAMPLE_RATE, { method: 'linear' });
  const out = new Int16Array(resampled.length);
  for (let i = 0; i < resampled.length; i++) {
    const s = Math.max(-32768, Math.min(32767, Math.round(resampled[i] * 32767)));
    out[i] = s;
  }
  return Buffer.from(out.buffer).toString('base64');
}

/**
 * Execute a voice action and persist to DB when applicable. Returns a short message for the model.
 * @param {string} name - Handler name (e.g. add_food)
 * @param {Record<string, unknown>} args - Function call args
 * @param {{ todayStr: string, userId: string }} ctx - Context
 * @returns {Promise<{ message: string }>}
 */
async function executeAndPersist(name, args, ctx) {
  const handler = HANDLERS[name];
  if (!handler) return { message: `Unknown action: ${name}.` };
  try {
    const result = await handler(args, ctx);
    const merge = result?.merge;
    const items = result?.items;

    if (!isDbConfigured()) {
      return { message: 'Done (database not configured).' };
    }

    const { userId } = ctx;

    if (name === 'add_schedule' && Array.isArray(items) && items.length > 0) {
      await scheduleService.createBatch(userId, items);
      return { message: `Added ${items.length} schedule item(s).` };
    }
    if (name === 'add_food' && merge) {
      await foodEntryService.create(userId, {
        date: merge.date,
        name: merge.name,
        calories: merge.calories ?? 0,
        protein: merge.protein ?? 0,
        carbs: merge.carbs ?? 0,
        fats: merge.fats ?? 0,
        portionAmount: merge.portionAmount,
        portionUnit: merge.portionUnit,
        startTime: merge.startTime,
        endTime: merge.endTime,
      });
      return { message: `Logged ${merge.name}${merge.calories != null ? `, ${merge.calories} kcal` : ''}.` };
    }
    if (name === 'add_transaction' && merge) {
      await transactionService.create(userId, merge);
      return { message: `Recorded ${merge.type}: ${merge.amount} ${merge.currency || 'USD'}.` };
    }
    if (name === 'add_workout' && merge) {
      await workoutService.create(userId, merge);
      return { message: `Logged workout: ${merge.title || 'Workout'}.` };
    }
    if (name === 'log_sleep' && merge) {
      await dailyCheckInService.create(userId, { date: merge.date, sleepHours: merge.sleepHours });
      return { message: `Logged ${merge.sleepHours ?? 0} hours of sleep.` };
    }
    if (name === 'add_goal' && merge) {
      await goalService.create(userId, merge);
      return { message: `Goal added: ${merge.target} ${merge.type} per ${merge.period}.` };
    }

    return { message: 'Done.' };
  } catch (e) {
    console.error('Voice Live: execute failed', name, e?.message ?? e);
    return { message: `Failed: ${e?.message ?? 'Unknown error'}.` };
  }
}

/**
 * Attach a Live API session to a client WebSocket. Forwards audio both ways; on tool calls, executes and persists.
 * @param {import('ws').WebSocket} clientWs - Client WebSocket (authenticated)
 * @param {string} userId - Authenticated user id
 */
export async function attachLiveSession(clientWs, userId) {
  if (!config.geminiApiKey) {
    clientWs.close(1011, 'Voice Live not configured (missing GEMINI_API_KEY)');
    return;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const ctx = { todayStr, userId, timezone: undefined };

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  let liveSession = null;

  function closeSession() {
    try {
      if (liveSession && typeof liveSession.close === 'function') liveSession.close();
    } catch (e) {
      // ignore
    }
    liveSession = null;
  }

  function sendToClient(payload) {
    if (clientWs.readyState !== clientWs.OPEN) return;
    try {
      clientWs.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
    } catch (e) {
      console.error('Voice Live: send to client failed', e?.message);
    }
  }

  try {
    liveSession = await ai.live.connect({
      model: LIVE_MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: VOICE_PROMPT,
        tools: VOICE_TOOLS,
      },
      callbacks: {
        onopen: () => {
          sendToClient({ type: 'connected' });
        },
        onmessage: async (message) => {
          if (message?.toolCall?.functionCalls?.length) {
            const functionResponses = [];
            for (const fc of message.toolCall.functionCalls) {
              const args = fc.args ?? {};
              const { message: msg } = await executeAndPersist(fc.name, args, ctx);
              functionResponses.push({ id: fc.id, name: fc.name, response: { message: msg } });
            }
            try {
              liveSession.sendToolResponse({ functionResponses });
            } catch (e) {
              console.error('Voice Live: sendToolResponse failed', e?.message);
            }
            return;
          }
          const content = message?.serverContent;
          if (content?.modelTurn?.parts) {
            for (const part of content.modelTurn.parts) {
              if (part?.inlineData?.data) {
                sendToClient({ type: 'audio', data: part.inlineData.data });
              }
            }
          }
          if (content?.turnComplete) {
            sendToClient({ type: 'turnComplete' });
          }
        },
        onerror: (e) => {
          console.error('Voice Live: Gemini error', e?.message ?? e);
          sendToClient({ type: 'error', error: e?.message ?? 'Live session error' });
        },
        onclose: (e) => {
          sendToClient({ type: 'closed', reason: e?.reason });
        },
      },
    });
  } catch (e) {
    console.error('Voice Live: connect failed', e?.message ?? e);
    sendToClient({ type: 'error', error: e?.message ?? 'Failed to connect to Live API' });
    clientWs.close(1011, 'Live connect failed');
    return;
  }

  function isValidDateStr(str) {
    if (!str || typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
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

  clientWs.on('message', (data) => {
    if (!liveSession) return;
    try {
      let base64;
      let sampleRate = TARGET_SAMPLE_RATE;
      if (Buffer.isBuffer(data)) {
        base64 = data.toString('base64');
      } else if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed?.type === 'context') {
            if (parsed.today != null && isValidDateStr(parsed.today)) ctx.todayStr = parsed.today;
            if (parsed.timezone != null && isValidTimezone(parsed.timezone)) ctx.timezone = parsed.timezone;
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'voiceLive.js:context', message: 'live context applied', data: { todayStr: ctx.todayStr, timezone: ctx.timezone }, timestamp: Date.now(), hypothesisId: 'H4' }) }).catch(() => {});
            // #endregion
            return;
          }
          if (parsed?.type === 'audio' && parsed?.data) {
            base64 = parsed.data;
            if (parsed.sampleRate != null && Number(parsed.sampleRate) > 0) {
              sampleRate = Number(parsed.sampleRate);
            }
          } else {
            base64 = data;
          }
        } catch {
          base64 = data;
        }
      }
      if (base64) {
        const toSend = sampleRate !== TARGET_SAMPLE_RATE ? resampleTo16k(base64, sampleRate) : base64;
        liveSession.sendRealtimeInput({
          audio: { data: toSend, mimeType: 'audio/pcm;rate=16000' },
        });
      }
    } catch (e) {
      console.error('Voice Live: send to Gemini failed', e?.message);
    }
  });

  clientWs.on('close', () => {
    closeSession();
  });

  clientWs.on('error', () => {
    closeSession();
  });
}
