/**
 * Feature flags for controlled rollout.
 * All flags default to false for safety.
 * Set via environment variables (VITE_FF_*).
 */

export const FEATURE_FLAGS = {
  /** Enable PWA features (service worker, install prompt) */
  PWA_ENABLED: import.meta.env.VITE_FF_PWA_ENABLED === 'true',

  /** Enable offline data sync with IndexedDB */
  PWA_OFFLINE_SYNC: import.meta.env.VITE_FF_PWA_OFFLINE_SYNC === 'true',

  /** Enable push notifications */
  PWA_PUSH_NOTIFICATIONS: import.meta.env.VITE_FF_PWA_PUSH === 'true',
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature flag is enabled.
 * @param flag - The feature flag to check
 * @returns true if the flag is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
