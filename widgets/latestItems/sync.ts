import type { LatestItemsWidgetConfig, LatestItemsWidgetPayload } from "./types";
import { getWidgetCache } from "@/widgets/shared/widgetCache";

/** Compact config list for native widgets (id, title, instanceUrl, collection). */
export type WidgetConfigListEntry = {
  id: string;
  title: string;
  instanceUrl: string;
  collection: string;
  /**
   * Optional: if present, widgets can fetch via Directus flow using widget_id.
   * If missing, they fall back to cached payload.
   */
  widgetId?: string;
  webhookUrl?: string;
};

export async function writeLatestItemsWidgetConfigListToCache(
  configs: LatestItemsWidgetConfig[]
): Promise<void> {
  // This function is only used to populate shared storage for native widgets.
  // Native side reads a single string value by key; the actual persistence
  // implementation lives elsewhere in the app.
  const list: WidgetConfigListEntry[] = configs.map((c) => ({
    id: String(c.id ?? ""),
    title: String(c.title ?? c.collection ?? ""),
    instanceUrl: String(c.instanceUrl ?? ""),
    collection: String(c.collection ?? ""),
    widgetId: c.widgetId != null ? String(c.widgetId) : undefined,
    webhookUrl: c.webhookUrl != null ? String(c.webhookUrl) : undefined,
  }));
  const cache = getWidgetCache();
  await cache.setConfigList(JSON.stringify(list));
}

function getTableFields(
  collection: string,
  preset: { layout_query?: { tabular?: { fields?: string[] } } } | null,
  fields: { field: string; meta?: { interface?: string } }[] | undefined
): string[] {
  if (preset?.layout_query?.tabular?.fields?.length) {
    return preset.layout_query.tabular.fields;
  }
  return (
    fields
      ?.filter(
        (f) =>
          !["group-accordion", "group-detail", "group-raw"].includes(
            (f.meta?.interface as string) ?? ""
          )
      )
      .map((f) => f.field) ?? []
  );
}

export async function syncLatestItemsWidget(_: {
  directus: { request: (opts: unknown) => Promise<unknown> };
  config: LatestItemsWidgetConfig;
}): Promise<void> {
  // No-op for now; widget payloads are fetched via the Directus flow webhook.
}

/** Remove cached payload for a config (e.g. after config deleted). */
export async function removeLatestItemsWidgetPayloadFromCache(
  configId: string
): Promise<void> {
  if (!configId || typeof configId !== "string") return;
  const cache = getWidgetCache();
  await cache.setPayload(configId, null);
}
