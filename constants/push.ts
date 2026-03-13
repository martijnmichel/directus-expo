export const APP_PUSH_DEVICES_COLLECTION = "app_push_devices";

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
}
