/**
 * Browser Notification API wrapper
 */

export type NotificationPermission = 'default' | 'granted' | 'denied';

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Get current notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission as NotificationPermission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermission;
  }

  return Notification.permission as NotificationPermission;
}

/**
 * Show a notification
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!isNotificationSupported() || getNotificationPermission() !== 'granted') {
    return null;
  }

  try {
    return new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  } catch (error) {
    console.error('Failed to show notification:', error);
    return null;
  }
}

/**
 * Schedule a notification (using setTimeout - for simple reminders)
 * Note: For persistent notifications, consider using Service Workers
 */
export function scheduleNotification(
  title: string,
  delayMs: number,
  options?: NotificationOptions
): number | null {
  if (getNotificationPermission() !== 'granted') {
    return null;
  }

  return window.setTimeout(() => {
    showNotification(title, options);
  }, delayMs);
}

/**
 * Cancel a scheduled notification
 */
export function cancelScheduledNotification(timeoutId: number): void {
  clearTimeout(timeoutId);
}

/**
 * Calculate milliseconds until a specific time today
 */
export function getMsUntilTime(hours: number, minutes: number = 0): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  
  // If time has passed today, schedule for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  
  return target.getTime() - now.getTime();
}

/**
 * Schedule daily reminder at a specific time
 */
export function scheduleDailyReminder(
  title: string,
  hours: number,
  minutes: number = 0,
  options?: NotificationOptions
): number | null {
  const delayMs = getMsUntilTime(hours, minutes);
  return scheduleNotification(title, delayMs, options);
}
