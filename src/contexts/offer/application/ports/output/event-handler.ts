/**
 * Port for event handlers.
 * Handlers implement this interface to process specific domain events.
 */
export interface EventHandler<T = unknown> {
  handle(event: T): Promise<void>;
}
