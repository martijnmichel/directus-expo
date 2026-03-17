import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  readCollections,
  readFlows,
  readItems,
  type RestCommand,
} from "@directus/sdk";
import {
  APP_WIDGET_CONFIG_COLLECTION,
  APP_WIDGET_FLOW_NAME,
  APP_WIDGET_FLOW_VERSION,
  APP_WIDGET_SUPPORTED,
} from "@/constants/widget";
import { fetchWidgetWebhookHandshake } from "@/widgets/latestItems/sync";

export type WidgetSetupState = {
  collectionExists: boolean;
  flowExists: boolean;
  access: "ok" | "forbidden" | "unknown";
  issues: Array<
    | "missing_collection"
    | "missing_flow"
    | "no_access"
    | "unknown_access"
  >;
};

export type WidgetAccessOnlyState = {
  access: "ok" | "forbidden" | "unknown";
};

export function isWidgetForbiddenError(error: unknown): boolean {
  if (error == null) return false;
  const anyErr = error as Record<string, unknown>;
  const status =
    anyErr?.status ??
    (anyErr?.response as Record<string, unknown>)?.status ??
    (anyErr?.errors as Array<{ extensions?: { status?: number } }>)?.[0]
      ?.extensions?.status;
  const code =
    anyErr?.code ??
    (anyErr?.errors as Array<{ extensions?: { code?: string } }>)?.[0]
      ?.extensions?.code;
  if (status === 403 || code === "FORBIDDEN") return true;
  const msg =
    typeof anyErr?.message === "string"
      ? anyErr.message.toLowerCase()
      : "";
  return msg.includes("403") || msg.includes("forbidden");
}

/**
 * Minimal check for non-admins: tests read access to app_widget_config with the
 * same filter the app uses (user_id) so we get 403 when the policy restricts by user.
 */
export function useWidgetAccessOnly(enabled: boolean = true) {
  const { directus, user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery<WidgetAccessOnlyState>({
    queryKey: ["widgetAccessOnly", userId],
    staleTime: 1,
    refetchOnMount: true,
    enabled: !!directus && enabled,
    queryFn: async () => {
      try {
        const filter: Record<string, unknown> = {};
        if (userId) filter.user_id = { _eq: userId };
        await directus!.request(
          readItems(APP_WIDGET_CONFIG_COLLECTION as any, {
            ...(Object.keys(filter).length > 0 && { filter }),
            limit: 1,
          }) as RestCommand<unknown, any>,
        );
        return { access: "ok" as const };
      } catch (error) {
        if (isWidgetForbiddenError(error)) {
          return { access: "forbidden" as const };
        }
        return { access: "unknown" as const };
      }
    },
  });
}

/**
 * Returns details about the widget setup (collection + flow + access).
 * Only run when the user can manage setup (admin); otherwise use useWidgetAccessOnly.
 */
export function useWidgetCollectionExists(enabled: boolean = true) {
  const { directus, user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery<WidgetSetupState>({
    queryKey: ["widgetCollectionExists", userId],
    staleTime: 1,
    refetchOnMount: true,
    enabled: !!directus && enabled,
    queryFn: async () => {
      const [collections, flows] = await Promise.all([
        directus!.request(readCollections()),
        directus!.request(
          readFlows({
            filter: { name: { _eq: APP_WIDGET_FLOW_NAME } },
            limit: 1,
          } as any),
        ),
      ]);

      const collectionExists = Array.isArray(collections)
        ? collections.some(
            (c: { collection?: string }) =>
              c.collection === APP_WIDGET_CONFIG_COLLECTION,
          )
        : false;

      const flowList = Array.isArray(flows)
        ? flows
        : ((flows as { data?: unknown[] })?.data ?? []);
      const flowExists = flowList.length > 0;

      let access: WidgetSetupState["access"] = "unknown";
      if (collectionExists) {
        try {
          await directus!.request(
            readItems(APP_WIDGET_CONFIG_COLLECTION as any, {
              limit: 1,
            }) as RestCommand<unknown, any>,
          );
          access = "ok";
        } catch (error) {
          if (isWidgetForbiddenError(error)) {
            access = "forbidden";
          } else {
            access = "unknown";
          }
        }
      }

      const issues: WidgetSetupState["issues"] = [];
      if (!collectionExists) issues.push("missing_collection");
      if (!flowExists) issues.push("missing_flow");
      if (access === "forbidden") issues.push("no_access");
      if (access === "unknown" && collectionExists)
        issues.push("unknown_access");

      return { collectionExists, flowExists, access, issues };
    },
  });
}

export const useWidgetFlowExists = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["widgetFlowExists"],
    queryFn: async () => {
      const flows = await directus!.request(readFlows({
        filter: { name: { _eq: APP_WIDGET_FLOW_NAME } },
        limit: 1,
      } as any));
      return Array.isArray(flows) ? flows.length > 0 : false;
    },
  });
};

/**
 * Fetches the widget webhook handshake (GET) via react-query.
 * Uses the current Directus instance base URL and looks up the flow by name.
 */
export function useFlowVersion(instanceUrl: string | null, enabled: boolean = true) {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["widgetFlowHandshake", instanceUrl],
    enabled: !!directus && !!instanceUrl && enabled,
    staleTime: 10_000,
    refetchOnMount: true,
    queryFn: async () => {
      if (!directus || !instanceUrl) return null;
      const flows = await directus.request(
        readFlows({
          filter: { name: { _eq: APP_WIDGET_FLOW_NAME } },
          limit: 1,
        } as any),
      );
      const flowList = Array.isArray(flows)
        ? flows
        : ((flows as { data?: unknown[] })?.data ?? []);
      const id = (flowList[0] as any)?.id ?? null;
      if (!id) throw new Error("Flow not found");
      const base = instanceUrl.replace(/\/+$/, "");
      const webhookUrl = `${base}/flows/trigger/${id}`;

      const handshake = await fetchWidgetWebhookHandshake(webhookUrl);
      const required = APP_WIDGET_SUPPORTED[0];
      const needsUpdate =
        handshake.version !== APP_WIDGET_FLOW_VERSION ||
        !handshake.supports.includes(required);
      return { ...handshake, needsUpdate };
    },
  });
}