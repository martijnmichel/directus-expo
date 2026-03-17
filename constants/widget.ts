/** Collection that stores per-user widget configs used by native widgets. */
export const APP_WIDGET_CONFIG_COLLECTION = "app_widget_config";

/** Single flow that resolves widget requests (webhook with widget_id in body). */
export const APP_WIDGET_FLOW_NAME = "App widgets data";

/**
 * Contract version for the widget webhook response.
 * Keep this in sync with the Directus Flow script.
 */
export const APP_WIDGET_FLOW_VERSION = 14;

/** Widget type identifier used across app + Directus flow. */
export const APP_WIDGET_TYPE_LATEST_ITEMS = "latest-items" as const;

/** Capabilities the app expects the flow to support. */
export const APP_WIDGET_SUPPORTED = [APP_WIDGET_TYPE_LATEST_ITEMS] as const;

/** Flow operation type ids (same as push). */
export const WIDGET_FLOW_OPERATION_TYPES = {
  readData: "item-read",
  runScript: "exec",
  condition: "condition",
} as const;
