import mitt, { Emitter } from "mitt";

// Define your event types here
export type MittEvents = {
  "m2m:add": { data: any; field: string };
  "m2m:remove": { data: any; field: string };
  "m2m:update": { data: any; field: string };
  error: Error;
};

// Create a singleton instance of the event emitter
const emitter: Emitter<MittEvents> = mitt<MittEvents>();

// Export a utility class for better organization
export class EventBus {
  static emit<K extends keyof MittEvents>(type: K, event: MittEvents[K]) {
    emitter.emit(type, event);
  }

  static on<K extends keyof MittEvents>(
    type: K,
    handler: (event: MittEvents[K]) => void
  ) {
    emitter.on(type, handler as any);
  }

  static off<K extends keyof MittEvents>(
    type: K,
    handler: (event: MittEvents[K]) => void
  ) {
    emitter.off(type, handler as any);
  }

  static clear() {
    emitter.all.clear();
  }
}

export default EventBus;
