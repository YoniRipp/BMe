import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as voiceController from './voice.js';
import * as voiceService from '../services/voice.js';

vi.mock('../config/index.js', () => ({
  config: {
    geminiApiKey: 'test-key',
  },
}));
vi.mock('../services/voice.js');

describe('voice controller', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {}, user: { id: 'user-1' } };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
  });

  describe('understand', () => {
    it('POST with transcript returns { actions }', async () => {
      req.body = { transcript: 'Add workout squats 3 sets of 10' };
      const actions = [{ type: 'add_workout', payload: { title: 'Squats' } }];
      voiceService.parseTranscript.mockResolvedValue({ actions });

      await voiceController.understand(req, res);

      expect(voiceService.parseTranscript).toHaveBeenCalledWith(
        'Add workout squats 3 sets of 10',
        'auto',
        'user-1',
        {}
      );
      expect(res.json).toHaveBeenCalledWith({ actions });
    });

    it('returns 400 when transcript is empty', async () => {
      req.body = { transcript: '   ' };

      await voiceController.understand(req, res);

      expect(voiceService.parseTranscript).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Transcript is empty' }));
    });

    it('returns 502 when service throws', async () => {
      req.body = { transcript: 'Add workout' };
      voiceService.parseTranscript.mockRejectedValue(new Error('Gemini API error'));

      await voiceController.understand(req, res);

      expect(voiceService.parseTranscript).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to understand voice',
          details: 'Gemini API error',
        })
      );
    });
  });
});
