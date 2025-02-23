import { CoreSchemaDocument } from "@/types/directus";
import { CoreSchema } from "@directus/sdk";
import mitt, { Emitter } from "mitt";

// Define your event types here
export type MittEvents = {
  "m2a:add": {
    data: CoreSchemaDocument;
    uuid: string;
    field: string;
    collection: keyof CoreSchema;
  };
  "m2a:update": {
    collection: keyof CoreSchema;
    uuid: string;
    docId: string | number;
  };
  "m2m:add": { data: CoreSchemaDocument; field: string; uuid: string };
  "m2m:update": {
    collection: keyof CoreSchema;
    docId: string | number;
    uuid: string;
  };
  "m2o:pick": { data: CoreSchemaDocument; field: string; uuid: string };

  "o2m:add": { data: CoreSchemaDocument; field: string; uuid: string };
  "o2m:pick": { data: CoreSchemaDocument; field: string; uuid: string };

  "file:pick": {
    data: string | string[];
    multiple: boolean;
    field: string;
    uuid: string;
  };
  "repeater:add": { data: Record<string, any>; field: string; uuid: string };
  "repeater:edit": {
    data: Record<string, any>;
    field: string;
    index: number;
    uuid: string;
  };
  "translations:edit": {
    data: Record<string, any>[];
    field: string;
    uuid: string;
  };
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
