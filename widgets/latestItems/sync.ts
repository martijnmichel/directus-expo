import type { LatestItemsWidgetConfig, LatestItemsWidgetPayload } from "./types";
import { getWidgetCache } from "@/widgets/shared/widgetCache";
import { APP_WIDGET_FLOW_VERSION, APP_WIDGET_SUPPORTED } from "@/constants/widget";

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
  /** Active session when synced; appended to `directus://content/...` row links. */
  sessionId?: string;
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
    sessionId: c.sessionId != null ? String(c.sessionId) : undefined,
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

export type WidgetWebhookHandshakeResponse = {
  version: number;
  supports: string[];
};

/**
 * Calls the Directus Flow webhook (GET) and returns handshake info.
 * Intended for checking whether the flow exists and is compatible.
 *
 * Expected response shape:
 * { version: 1, supports: ["latest-items"] }
 */
export async function fetchWidgetWebhookHandshake(
  webhookUrl: string
): Promise<WidgetWebhookHandshakeResponse> {
  if (!webhookUrl) throw new Error("Missing webhookUrl");
  const res = await fetch(webhookUrl, { method: "GET" });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  let json: any;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Non-JSON response: ${text.slice(0, 500)}`);
  }

  if (!json || typeof json !== "object") throw new Error("Invalid JSON response");
  if (typeof json.version !== "number") throw new Error("Missing/invalid 'version' in response");
  if (!Array.isArray(json.supports)) throw new Error("Missing/invalid 'supports' in response");

  const supports = json.supports.map((s: any) => String(s));

  return { version: json.version, supports };
}

/** Convenience: strict check for latest-items compatibility. */
export async function testLatestItemsWidgetWebhook(
  config: LatestItemsWidgetConfig
): Promise<WidgetWebhookHandshakeResponse> {
  const webhookUrl = config.webhookUrl;
  if (!webhookUrl) throw new Error("No webhookUrl on this setup");
  const handshake = await fetchWidgetWebhookHandshake(webhookUrl);
  if (handshake.version !== APP_WIDGET_FLOW_VERSION) {
    throw new Error(
      `Flow version mismatch: got ${handshake.version}, expected ${APP_WIDGET_FLOW_VERSION}`
    );
  }
  const required = APP_WIDGET_SUPPORTED[0];
  if (!handshake.supports.includes(required)) {
    throw new Error(
      `Flow does not support '${required}'. supports=[${handshake.supports.join(", ")}]`
    );
  }
  return handshake;
}
