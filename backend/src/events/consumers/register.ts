import { EventEnvelope } from '../dispatcher.js';
import { registerPushNotifierConsumer } from './pushNotifier.js';
import { registerStatsAggregatorConsumer } from './statsAggregator.js';
import { registerStreakUpdaterConsumer } from './streakUpdater.js';
import { registerUserActivityLogConsumer } from './userActivityLog.js';

type SubscribeFn = (eventType: string, handler: (event: EventEnvelope) => Promise<void> | void) => void;

export function registerAllEventConsumers(subscribe: SubscribeFn) {
  registerUserActivityLogConsumer(subscribe);
  registerStatsAggregatorConsumer(subscribe);
  registerPushNotifierConsumer(subscribe);
  registerStreakUpdaterConsumer(subscribe);
}
