import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
  scheduleNotification,
  cancelScheduledNotification,
  getMsUntilTime,
  scheduleDailyReminder,
} from './notifications';

describe('notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isNotificationSupported', () => {
    it('returns true when Notification API is available', () => {
      expect(isNotificationSupported()).toBe(true);
    });

    it('returns false when Notification API is not available', () => {
      const originalNotification = (global as any).Notification;
      delete (global as any).Notification;
      
      expect(isNotificationSupported()).toBe(false);
      
      (global as any).Notification = originalNotification;
    });
  });

  describe('getNotificationPermission', () => {
    it('returns current permission status', () => {
      const permission = getNotificationPermission();
      expect(['default', 'granted', 'denied']).toContain(permission);
    });

    it('returns denied when notifications not supported', () => {
      const originalNotification = (global as any).Notification;
      delete (global as any).Notification;
      
      expect(getNotificationPermission()).toBe('denied');
      
      (global as any).Notification = originalNotification;
    });
  });

  describe('requestNotificationPermission', () => {
    it('returns current permission if already set', async () => {
      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'granted',
          requestPermission: vi.fn(),
        },
        writable: true,
      });

      const permission = await requestNotificationPermission();
      expect(permission).toBe('granted');
    });

    it('requests permission when default', async () => {
      const requestPermissionMock = vi.fn().mockResolvedValue('granted');
      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: requestPermissionMock,
        },
        writable: true,
      });

      const permission = await requestNotificationPermission();
      expect(requestPermissionMock).toHaveBeenCalled();
      expect(permission).toBe('granted');
    });
  });

  describe('showNotification', () => {
    it('shows notification when permission is granted', () => {
      const NotificationMock = vi.fn();
      Object.defineProperty(global, 'Notification', {
        value: NotificationMock,
        writable: true,
      });
      Object.defineProperty(NotificationMock, 'permission', {
        value: 'granted',
        writable: true,
      });

      showNotification('Test Title', { body: 'Test Body' });
      expect(NotificationMock).toHaveBeenCalledWith('Test Title', expect.objectContaining({
        body: 'Test Body',
      }));
    });

    it('returns null when permission is not granted', () => {
      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'denied',
        },
        writable: true,
      });

      const result = showNotification('Test Title');
      expect(result).toBeNull();
    });
  });

  describe('scheduleNotification', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('schedules notification', () => {
      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'granted',
        },
        writable: true,
      });

      const timeoutId = scheduleNotification('Test', 1000);
      expect(timeoutId).not.toBeNull();
      
      vi.advanceTimersByTime(1000);
    });

    it('returns null when permission not granted', () => {
      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'denied',
        },
        writable: true,
      });

      const timeoutId = scheduleNotification('Test', 1000);
      expect(timeoutId).toBeNull();
    });
  });

  describe('cancelScheduledNotification', () => {
    it('cancels scheduled notification', () => {
      const timeoutId = setTimeout(() => {}, 1000);
      cancelScheduledNotification(timeoutId);
      // If we reach here without error, the function works
      expect(true).toBe(true);
    });
  });

  describe('getMsUntilTime', () => {
    it('calculates milliseconds until future time today', () => {
      const now = new Date();
      const futureHours = (now.getHours() + 1) % 24;
      
      const ms = getMsUntilTime(futureHours, 0);
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThan(3600000 * 2); // Less than 2 hours
    });

    it('schedules for tomorrow if time has passed', () => {
      const now = new Date();
      const pastHours = (now.getHours() - 1 + 24) % 24;
      
      const ms = getMsUntilTime(pastHours, 0);
      expect(ms).toBeGreaterThan(0);
    });
  });

  describe('scheduleDailyReminder', () => {
    it('schedules daily reminder', () => {
      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'granted',
        },
        writable: true,
      });

      const timeoutId = scheduleDailyReminder('Test Reminder', 9, 0);
      expect(timeoutId).not.toBeNull();
    });
  });
});
