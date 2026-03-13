export const APP_PUSH_DEVICES_COLLECTION = "app_push_devices";

/** Flow that sends item create/update/delete events to the push endpoint. */
export const APP_PUSH_FLOW_NAME = "App push notifications";

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
