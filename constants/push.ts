export const APP_PUSH_DEVICES_COLLECTION = "app_push_devices";

/** Flow that sends item create/update/delete events to the push endpoint. */
export const APP_PUSH_FLOW_NAME = "App push notifications";

/**
 * Flow operation type ids from Directus API source (defineOperationApi id).
 * Read Data: item-read, Run Script: exec, Request: request.
 * (transform in API docs = Transform payload operation, not Run Script.)
 */
export const PUSH_FLOW_OPERATION_TYPES = {
  readData: "item-read",
  runScript: "exec",
  request: "request",
} as const;

export type PushFlowOperationTypes = typeof PUSH_FLOW_OPERATION_TYPES;

/** Push endpoint URL (website). Install writes this into the flow. */
export const PUSH_ENDPOINT_URL = "https://directusmobile.app/api/push";

export type PushPlatform = "ios" | "android";

export interface PushSubscriptionEntry {
  collection: string;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface AppPushDeviceRecord {
  id: number | string;
  token: string;
  platform: PushPlatform;
  subscriptions: PushSubscriptionEntry[];
  /** Directus user who owns this device (per-server, per-user). */
  user_id?: string | null;
}
