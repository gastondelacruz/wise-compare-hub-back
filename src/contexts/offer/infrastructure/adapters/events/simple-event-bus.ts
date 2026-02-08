import { Injectable } from '@nestjs/common';
import { EventBus } from '@contexts/offer/application/ports/output/event-bus';
import { EventHandler } from '@contexts/offer/application/ports/output/event-handler';

/**
 * Simple in-memory event bus implementation.
 * Routes events to registered handlers based on event type.
 */
@Injectable()
export class SimpleEventBus implements EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Register an event handler for a specific event type.
   */
  registerHandler(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async publish(event: unknown): Promise<void> {
    const eventType = this.getEventType(event);
    if (!eventType) {
      return; // Unknown event type, ignore
    }

    const handlers = this.handlers.get(eventType) || [];
    const promises = handlers.map((handler) =>
      handler.handle(event).catch(() => {
        // Fail gracefully - log error but don't throw
        // In production, you might want to log to a proper logging service
      }),
    );

    await Promise.allSettled(promises);
  }

  private getEventType(event: unknown): string | null {
    if (
      event &&
      typeof event === 'object' &&
      'eventType' in event &&
      typeof event.eventType === 'string'
    ) {
      return event.eventType;
    }
    return null;
  }
}
