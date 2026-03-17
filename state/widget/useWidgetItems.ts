import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { readFlows, readItems } from "@directus/sdk";
import {
  APP_WIDGET_CONFIG_COLLECTION,
  APP_WIDGET_FLOW_NAME,
  APP_WIDGET_TYPE_LATEST_ITEMS,
} from "@/constants/widget";
import type { LatestItemsWidgetConfig } from "@/widgets/latestItems/types";

function coerceArray(val: unknown): string[] | undefined {
  if (!Array.isArray(val)) return undefined;
  return val.map((x) => String(x));
}

async function getWebhookUrlForInstance(directus: any) {
  const instanceUrl: string | null =
    ((directus as any)?.url as string | undefined) ||
    ((directus as any)?.client?.url as string | undefined) ||
    null;
  if (!instanceUrl) return null;
  const flows = await directus.request(
    readFlows({
      filter: { name: { _eq: APP_WIDGET_FLOW_NAME } },
      limit: 1,
    } as any),
  );
  const list = Array.isArray(flows) ? flows : ((flows as any)?.data ?? []);
  const id = (list[0] as any)?.id ?? null;
  if (!id) return null;
  const base = instanceUrl.replace(/\/+$/, "");
  return `${base}/flows/trigger/${id}`;
}

export function useWidgetItems(params: {
  enabled?: boolean;
}) {
  const { directus, user } = useAuth();
  const enabled = params.enabled ?? true;
  const instanceUrl =
    ((directus as any)?.url as string | undefined) ||
    ((directus as any)?.client?.url as string | undefined) ||
    null;
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["widgetConfigs", instanceUrl, userId],
    enabled: !!directus && !!instanceUrl && !!userId && enabled,
    staleTime: 5_000,
    queryFn: async (): Promise<{ configs: LatestItemsWidgetConfig[] }> => {
      if (!directus || !instanceUrl || !userId) return { configs: [] };
      const webhookUrl = await getWebhookUrlForInstance(directus);

      // Directus-first list, filtered by current user.
      const rowsRaw = await directus.request(
        readItems(APP_WIDGET_CONFIG_COLLECTION as any, {
          filter: { user_id: { _eq: userId } },
          limit: -1,
        } as any),
      );
      const rows = Array.isArray(rowsRaw) ? rowsRaw : ((rowsRaw as any)?.data ?? []);

      const mapped: LatestItemsWidgetConfig[] = (rows as any[])
        .map((row) => ({
          id: String(row.id ?? ""),
          widgetId: row.id != null ? String(row.id) : undefined,
          instanceUrl: instanceUrl,
          collection: row.collection ?? "",
          sort: row.sort ?? "",
          limit: row.limit ?? 5,
          fields: coerceArray(row.fields) ?? [],
          title: row.title,
          webhookUrl: webhookUrl?.toString() ?? undefined,
          type: row.type ? String(row.type) : APP_WIDGET_TYPE_LATEST_ITEMS,
        }))
        .filter((c) => c.id.length > 0);

      return { configs: mapped };
    },
  });
}

