/**
 * Port for event bus functionality.
 * Allows publishing domain events in a decoupled way.
 */
export interface EventBus {
  publish(event: unknown): Promise<void>;
}
