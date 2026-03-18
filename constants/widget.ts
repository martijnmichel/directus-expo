/** Collection that stores per-user widget configs used by native widgets. */
export const APP_WIDGET_CONFIG_COLLECTION = "app_widget_config";

/** Single flow that resolves widget requests (webhook with widget_id in body). */
export const APP_WIDGET_FLOW_NAME = "App widgets data";

/**
 * Contract version for the widget webhook response.
 * Keep this in sync with the Directus Flow script.
 */
export const APP_WIDGET_FLOW_VERSION = 39;

/** Widget type identifier used across app + Directus flow. */
export const APP_WIDGET_TYPE_LATEST_ITEMS = "latest-items" as const;

export const APP_WIDGET_TYPES = [
  { value: APP_WIDGET_TYPE_LATEST_ITEMS, label: "Latest items" },
] as const;

export function getWidgetTypeLabel(value: string | null | undefined): string {
  const hit = APP_WIDGET_TYPES.find((t) => t.value === value);
  return hit?.label ?? String(value ?? "");
}

/** Capabilities the app expects the flow to support. */
export const APP_WIDGET_SUPPORTED = [APP_WIDGET_TYPE_LATEST_ITEMS] as const;

/** Latest-items slot definitions (single source of truth for UI + flow defaults). */
export const APP_WIDGET_LATEST_ITEMS_SLOTS = [
  {
    key: "left",
    labelKey: "widget.latestItems.slots.left.label",
    hintKey: "widget.latestItems.slots.left.hint",
  },
  {
    key: "title",
    labelKey: "widget.latestItems.slots.title.label",
    hintKey: "widget.latestItems.slots.title.hint",
  },
  {
    key: "subtitle",
    labelKey: "widget.latestItems.slots.subtitle.label",
    hintKey: "widget.latestItems.slots.subtitle.hint",
  },
  {
    key: "right",
    labelKey: "widget.latestItems.slots.right.label",
    hintKey: "widget.latestItems.slots.right.hint",
  },
] as const;

/** Flow operation type ids (same as push). */
export const WIDGET_FLOW_OPERATION_TYPES = {
  readData: "item-read",
  runScript: "exec",
  condition: "condition",
} as const;
