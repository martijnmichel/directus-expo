import { objectToBase64 } from "@/helpers/document/docToBase64";
import { CoreSchemaDocument } from "@/types/directus";
import { CoreSchema } from "@directus/sdk";
import { useRouter } from "expo-router";
import mitt, { Emitter } from "mitt";

// Define your event types here
export type MittEvents = {
  /**
   * M2A (Many to Any)
   */
  "m2a:add": {
    data: CoreSchemaDocument;
    field: string;
    document_session_id: string | number;
    draft_id?: string;
    // __id set by picking an existing item
    __id?: string;
    collection: keyof CoreSchema;
  };
  "m2a:update": {
    collection: keyof CoreSchema;
    document_session_id: string | number;
    field: string;
    data: CoreSchemaDocument;
    junction_id: string | number;
    draft_id: string;
  };

  /**
   * M2M (Many to Many)
   */
  "m2m:add": {
    data: CoreSchemaDocument;
    field: string;
    document_session_id: string | number;
    draft_id?: string;
    // __id set by picking an existing item
    __id?: string;
  };
  "m2m:update": {
    collection: keyof CoreSchema;
    document_session_id: string | number;
    field: string;
    data: CoreSchemaDocument;
    junction_id: string | number;
    draft_id: string;
  };

  /**
   * M2O (Many to One)
   */
  "m2o:pick": {
    data: CoreSchemaDocument;
    field: string;
    document_session_id: string;
  };

  /**
   * O2M (One to Many)
   */
  "o2m:update": {
    collection: keyof CoreSchema;
    document_session_id: string | number;
    field: string;
    data: CoreSchemaDocument;
    draft_id: string;
  };
  "o2m:add": {
    data: CoreSchemaDocument;
    field: string;
    document_session_id: string;
    draft_id?: string;
    // __id set by picking an existing item
    __id?: string;
  };

  /**
   * File (File)
   */
  "file:pick": {
    data: string | string[];
    multiple: boolean;
    field: string;
    uuid: string;
  };

  /**
   * Repeater (Repeater)
   */
  "repeater:add": { data: Record<string, any>; field: string; uuid: string };
  "repeater:edit": {
    data: Record<string, any>;
    field: string;
    index: number;
    uuid: string;
  };

  /**
   * Translations (Translations)
   */
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
    handler: (event: MittEvents[K]) => void,
  ) {
    emitter.on(type, handler as any);
  }

  static off<K extends keyof MittEvents>(
    type: K,
    handler: (event: MittEvents[K]) => void,
  ) {
    emitter.off(type, handler as any);
  }

  static clear() {
    emitter.all.clear();
  }
}

export default EventBus;

export enum RelatedItemTypes {
  M2M = "m2m",
  M2A = "m2a",
  M2O = "m2o",
  O2M = "o2m",
}

export enum RelatedItemState {
  Default = "default",
  Created = "created",
  Updated = "updated",
  Deleted = "deleted",
  Picked = "picked",
}

export type RelatedItem = {
  id?: number | string; // used for existing items
  [key: string]: any;
  __id?: string; // used for new items
  __state?: RelatedItemState;
};

type RelatedModalParamsBase = {
  collection: string;
  document_session_id: string;
  item_field: string;
  draft: Record<string, any> | undefined;
  id: string | number;
  state?: RelatedItemState;
};

type RelatedModalParamsM2M = RelatedModalParamsBase & {
  type: RelatedItemTypes.M2M;
  junction_id: string | number;
};

type RelatedModalParams = RelatedModalParamsM2M;

export const useRelatedModal = ({
  collection,
  document_session_id,
  item_field,
  draft,
  type,
  junction_id,
  id,
  state,
}: RelatedModalParams) => {
  const router = useRouter();
  const params = {
    collection,
    document_session_id,
    item_field,
    draft: draft ? objectToBase64(draft) : undefined,
    id,
  };
  if (type === RelatedItemTypes.M2M) {
    (params as RelatedModalParamsM2M).junction_id = junction_id;
  }
  switch (state) {
    case RelatedItemState.Created:
      router.push({
        pathname: `/modals/${type}/[collection]/add`,
        params,
      });
      break;
    case RelatedItemState.Updated:
      router.push({
        pathname: `/modals/${type}/[collection]/[id]`,
        params,
      });
      break;
    default:
      router.push({
        pathname: `/modals/${type}/[collection]/[id]`,
        params,
      });
      break;
  }
};
