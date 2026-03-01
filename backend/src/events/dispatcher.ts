/**
 * Event dispatcher: subscribe(eventType, handler) and dispatch(event).
 * Shared by event bus, event-consumer, and Lambda handlers.
 */

export interface EventEnvelope {
  eventId: string;
  type: string;
  payload: Record<string, unknown>;
  metadata: {
    userId: string;
    timestamp: string;
    correlationId?: string;
    causationId?: string;
  };
}

export type EventHandler = (event: EventEnvelope) => void | Promise<void>;

export function createDispatcher() {
  const handlersByType = new Map<string, EventHandler[]>();

  function getHandlers(eventType: string): EventHandler[] {
    return handlersByType.get(eventType) || [];
  }

  return {
    subscribe(eventType: string, handler: EventHandler) {
      if (!handlersByType.has(eventType)) handlersByType.set(eventType, []);
      handlersByType.get(eventType)!.push(handler);
    },

    async dispatch(event: EventEnvelope) {
      const handlers = [...getHandlers(event?.type ?? ''), ...getHandlers('*')];
      for (const h of handlers) {
        try {
          await Promise.resolve(h(event));
        } catch (err) {
          throw err;
        }
      }
    },
  };
}
