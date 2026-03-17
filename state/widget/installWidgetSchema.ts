import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  createCollection,
  createField,
  createFlow,
  createOperation,
  createPolicy,
  deleteCollection,
  deleteFlow,
  deletePolicy,
  readCollections,
  readFlows,
  readOperations,
  readItems,
  type RestCommand,
  updateFlow,
  updateOperation,
} from "@directus/sdk";
import {
  APP_WIDGET_CONFIG_COLLECTION,
  APP_WIDGET_FLOW_NAME,
  APP_WIDGET_FLOW_VERSION,
  APP_WIDGET_SUPPORTED,
  WIDGET_FLOW_OPERATION_TYPES,
} from "@/constants/widget";

type WidgetSetupState = {
  collectionExists: boolean;
  flowExists: boolean;
  access: "ok" | "forbidden" | "unknown";
};

const WIDGET_FIELDS: Array<{
  field: string;
  type: string;
  meta: Record<string, unknown>;
}> = [
  {
    field: "id",
    type: "uuid",
    meta: {
      special: ["uuid"],
      hidden:true,
      required: true,
      primary_key: true,
      note: "Primary key (UUID, auto-generated).",
    },
  },
  {
    field: "type",
    type: "string",
    meta: {
      interface: "select-dropdown",
      options: {
        choices: [{ text: "Collection", value: "collection" }],
      },
      required: true,
      note: "Widget type. Currently only 'collection' is supported.",
    },
  },
  {
    field: "user_id",
    type: "uuid",
    meta: {
      interface: "select-dropdown-m2o",
      special: ["directus_users"],
      required: true,
      note: "Owner of this widget config (set by app; used for per-user widgets).",
    },
  },
  {
    field: "collection",
    type: "string",
    meta: { interface: "input", required: true },
  },
  {
    field: "filter",
    type: "json",
    meta: {
      interface: "input-code",
      options: { language: "json" },
      note: "Optional filter for the widget query.",
    },
  },
  {
    field: "sort",
    type: "string",
    meta: {
      interface: "input",
      note: "Directus sort string, e.g. -date_updated.",
    },
  },
  {
    field: "limit",
    type: "integer",
    meta: {
      interface: "numeric",
      note: "Max number of items to return.",
    },
  },
];

/**
 * Minimal check: does the current user have R access to app_widget_config
 * for at least one row owned by them (using the same user_id filter the app uses)?
 */
export function useWidgetAccessOnly(enabled: boolean = true) {
  const { directus, user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation<WidgetSetupState, unknown, void>({
    mutationFn: async () => {
      if (!directus || !enabled) {
        return { collectionExists: false, flowExists: false, access: "unknown" };
      }

      const collections = await directus.request(readCollections());
      const collectionExists = Array.isArray(collections)
        ? collections.some(
            (c: { collection?: string }) =>
              c.collection === APP_WIDGET_CONFIG_COLLECTION,
          )
        : false;

      if (!collectionExists) {
        return { collectionExists: false, flowExists: false, access: "unknown" };
      }

      try {
        const filter: Record<string, unknown> = {};
        if (userId) filter.user_id = { _eq: userId };
        await directus.request(
          readItems(APP_WIDGET_CONFIG_COLLECTION as any, {
            ...(Object.keys(filter).length > 0 && { filter }),
            limit: 1,
          }) as RestCommand<unknown, any>,
        );
        return { collectionExists: true, flowExists: false, access: "ok" };
      } catch (error) {
        const anyErr = error as Record<string, unknown>;
        const status =
          anyErr?.status ??
          (anyErr?.response as Record<string, unknown>)?.status;
        const code =
          anyErr?.code ??
          (anyErr?.errors as Array<{ extensions?: { code?: string } }>)?.[0]
            ?.extensions?.code;
        const forbidden =
          status === 403 ||
          code === "FORBIDDEN" ||
          (typeof anyErr?.message === "string" &&
            anyErr.message.toLowerCase().includes("forbidden"));
        return {
          collectionExists: true,
          flowExists: false,
          access: forbidden ? "forbidden" : "unknown",
        };
      }
    },
  });
}

/**
 * Installs the app_widget_config collection and a flow that:
 * - Accepts POST { widget_id } on its webhook trigger.
 * - Reads the widget row and runs the same permission chain as push (for read).
 * - Returns [] if the widget row is missing or the owner has no read access.
 * - Otherwise reads the collection with $full and returns the items.
 *
 * Requires admin / flow permissions.
 */
export function useInstallWidgetSchema() {
  const { directus } = useAuth();
  const queryClient = useQueryClient();

  const WIDGET_POLICY_NAME = "App widgets (create, read, update, delete own)";

  return useMutation({
    mutationFn: async () => {
      if (!directus) throw new Error("Not authenticated");

      const [collections, flowsRaw] = await Promise.all([
        directus.request(readCollections()),
        directus.request(
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

      const flowsList = Array.isArray(flowsRaw)
        ? flowsRaw
        : ((flowsRaw as { data?: unknown[] })?.data ?? []);
      const flowExists = flowsList.length > 0;
      const existingFlowId: string | null =
        flowExists
          ? ((flowsList[0] as any)?.id ??
            (flowsList[0] as any)?.data?.id ??
            null)
          : null;

      let createdCollection = false;
      let createdFlowId: string | null = null;
      let createdPolicyId: string | null = null;

      try {
        if (!collectionExists) {
          await directus.request(
            createCollection({
              collection: APP_WIDGET_CONFIG_COLLECTION,
              meta: {
                icon: "widgets",
                note: "Configs for native widgets (per user, per collection).",
                hidden: false,
              },
              schema: { name: APP_WIDGET_CONFIG_COLLECTION },
            } as any),
          );
          createdCollection = true;

          for (const f of WIDGET_FIELDS) {
            await directus.request(
              createField(APP_WIDGET_CONFIG_COLLECTION as any, {
                field: f.field,
                type: f.type,
                meta: f.meta,
              } as any),
            );
          }
        }

        // If the flow already exists, keep it up-to-date (safe metadata/options update).
        if (flowExists && existingFlowId) {
          await directus.request(
            updateFlow(existingFlowId, {
              name: APP_WIDGET_FLOW_NAME,
              icon: "widgets",
              description:
                "Widget webhook (GET-only). GET with no params returns {version,supports}. GET with ?widget_id=... returns widget data.",
              status: "active",
              trigger: "webhook",
              options: {
                method: "GET",
                async: false,
                response_body: "$last",
              },
            } as any),
          );

          // Ensure GET-only handshake + widget_id branching exists (and update id source to querystring).
          // Flow shape:
          //   extract_query (exec) -> condition(widget_id present?) -> resolve: existing start -> ...
          //                                         reject: handshake (exec) -> {version,supports}
          const opTypes = WIDGET_FLOW_OPERATION_TYPES;
          const opsRaw = await directus.request(
            readOperations({
              filter: { flow: { _eq: existingFlowId } },
              limit: -1,
            } as any),
          );
          const opsList = Array.isArray(opsRaw)
            ? opsRaw
            : ((opsRaw as { data?: unknown[] })?.data ?? []);

          const byKey = new Map<string, any>();
          for (const op of opsList as any[]) {
            if (op?.key) byKey.set(String(op.key), op);
          }

          const flowOperationId: string | null =
            (flowsList[0] as any)?.operation ?? null;
          const fallbackStartId: string | null =
            (byKey.get("widget_config")?.id as string | undefined) ?? null;
          const existingStartId: string | null = flowOperationId ?? fallbackStartId;

          // 1) Ensure handshake op exists
          let handshakeOp = byKey.get("handshake");
          if (!handshakeOp) {
            handshakeOp = await directus.request(
              createOperation({
                flow: existingFlowId,
                key: "handshake",
                type: opTypes.runScript,
                name: "Handshake (version + supports)",
                position_x: 60,
                position_y: -80,
                resolve: null,
                options: {
                  code: `
module.exports = async function () {
  return { version: ${APP_WIDGET_FLOW_VERSION}, supports: ${JSON.stringify(APP_WIDGET_SUPPORTED)} };
};`.trim(),
                },
              } as any),
            );
          } else {
            // Keep handshake payload up to date
            await directus.request(
              updateOperation(handshakeOp.id, {
                options: {
                  ...(handshakeOp.options ?? {}),
                  code: `
module.exports = async function () {
  return { version: ${APP_WIDGET_FLOW_VERSION}, supports: ${JSON.stringify(APP_WIDGET_SUPPORTED)} };
};`.trim(),
                },
              } as any),
            );
          }

          // 2) Ensure condition op exists (branches based on extract_query.widget_id presence)
          let conditionOp = byKey.get("widget_id_present");
          if (!conditionOp) {
            conditionOp = await directus.request(
              createOperation({
                flow: existingFlowId,
                key: "widget_id_present",
                type: opTypes.condition,
                name: "widget_id present?",
                position_x: 40,
                position_y: -40,
                resolve: existingStartId,
                reject: (handshakeOp as any).id,
                options: {
                  // Condition Rules (Filter Rules). We validate output of extract_query.
                  filter: { extract_query: { widget_id: { _nnull: true } } },
                },
              } as any),
            );
          } else {
            await directus.request(
              updateOperation(conditionOp.id, {
                resolve: existingStartId,
                reject: (handshakeOp as any).id,
                options: { ...(conditionOp.options ?? {}), filter: { extract_query: { widget_id: { _nnull: true } } } },
              } as any),
            );
          }

          // 3) Ensure extract_query op exists and is the flow start op
          let extractOp = byKey.get("extract_query");
          if (!extractOp) {
            extractOp = await directus.request(
              createOperation({
                flow: existingFlowId,
                key: "extract_query",
                type: opTypes.runScript,
                name: "Extract widget_id from query",
                position_x: 20,
                position_y: -40,
                resolve: (conditionOp as any).id,
                options: {
                  code: `
module.exports = async function (data) {
  const q = (data && data.$trigger && data.$trigger.query) ? data.$trigger.query : {};
  const widget_id = q && q.widget_id != null ? String(q.widget_id) : null;
  const uuid = typeof widget_id === "string" ? widget_id.trim() : "";
  const is_uuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
  return { widget_id: is_uuid ? uuid : null };
};`.trim(),
                },
              } as any),
            );
          } else {
            await directus.request(
              updateOperation(extractOp.id, {
                resolve: (conditionOp as any).id,
                options: {
                  ...(extractOp.options ?? {}),
                  code: `
module.exports = async function (data) {
  const q = (data && data.$trigger && data.$trigger.query) ? data.$trigger.query : {};
  const widget_id = q && q.widget_id != null ? String(q.widget_id) : null;
  const uuid = typeof widget_id === "string" ? widget_id.trim() : "";
  const is_uuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
  return { widget_id: is_uuid ? uuid : null };
};`.trim(),
                },
              } as any),
            );
          }

          // 4) Update widget_config operation to use extracted widget_id (GET-only)
          const widgetConfigOp = byKey.get("widget_config");
          if (widgetConfigOp?.id) {
            const prevOptions = widgetConfigOp.options ?? {};
            const prevQuery = prevOptions.query ?? {};
            const prevFilter = prevQuery.filter ?? {};
            await directus.request(
              updateOperation(widgetConfigOp.id, {
                options: {
                  ...prevOptions,
                  query: {
                    ...prevQuery,
                    filter: {
                      ...prevFilter,
                      id: "{{ extract_query.widget_id }}",
                    },
                  },
                },
              } as any),
            );
          }

          // 5) Make extract_query the entrypoint
          await directus.request(updateFlow(existingFlowId, { operation: (extractOp as any).id } as any));
        }

        if (!flowExists) {
          const flow = await directus.request(
            createFlow({
              name: APP_WIDGET_FLOW_NAME,
              icon: "widgets",
              description:
                "Resolves widget_id to config, checks read permissions like push, and returns collection items.",
              status: "active",
              trigger: "webhook",
              options: {
                // Synchronous: wait for flow to finish and return $last.
                method: "GET",
                async: false,
                response_body: "$last",
              },
            } as any),
          );

          const flowId =
            (flow as { id?: string })?.id ??
            (flow as { data?: { id?: string } })?.data?.id;
          if (!flowId) throw new Error("Flow created but no id returned");
          createdFlowId = flowId;

          const opTypes = WIDGET_FLOW_OPERATION_TYPES;

          // Order of operations: read widget config -> permissions -> policies -> roles -> users -> collection -> script.
          const opReadCollection = await directus.request(
            createOperation({
              flow: flowId,
              key: "read_collection",
              type: opTypes.readData,
              name: "Read collection",
              position_x: 60,
              position_y: 0,
              resolve: null,
              options: {
                collection: "{{ widget_config.collection }}",
                permissions: "$full",
                emitEvents: false,
                query: {
                  limit: "{{ widget_config.limit || 10 }}",
                  sort: "{{ widget_config.sort || '-date_updated' }}",
                  filter: "{{ widget_config.filter || {} }}",
                },
              },
            } as any),
          );

          const opScript = await directus.request(
            createOperation({
              flow: flowId,
              key: "filter_items",
              type: opTypes.runScript,
              name: "Filter items by read access",
              position_x: 80,
              position_y: 0,
              resolve: opReadCollection as any,
              options: {
                code: `
module.exports = async function (data) {
  const widget = (data.widget_config && Array.isArray(data.widget_config.data))
    ? data.widget_config.data[0]
    : (Array.isArray(data.widget_config) ? data.widget_config[0] : data.widget_config);
  if (!widget || !widget.user_id || !widget.collection) {
    return [];
  }
  // Only support collection-type widgets for now.
  if (widget.type && widget.type !== "collection") {
    return [];
  }

  function asArray(val) {
    if (Array.isArray(val)) return val;
    if (val && typeof val === "object" && Array.isArray(val.data)) return val.data;
    return [];
  }

  const collection = widget.collection;
  const permissions = asArray(data.read_permissions);
  const policies = asArray(data.read_policies);
  const roles = asArray(data.read_roles);
  const users = asArray(data.read_users);
  const items = asArray(data.read_collection);

  function toPolicyId(p) {
    if (p == null) return null;
    if (typeof p === "string") return p;
    if (typeof p === "number") return String(p);
    if (typeof p === "object") {
      var id = p.id || p.policy || p.directus_policies_id || null;
      if (id != null && typeof id === "object") id = (id.id != null ? id.id : null);
      return id != null ? String(id) : null;
    }
    return null;
  }

  var policyIdsFromPermissions = new Set(
    permissions
      .filter(function (p) { return p && p.collection === collection && p.action === "read"; })
      .map(function (p) { return toPolicyId(p.policy); })
      .filter(Boolean)
  );

  var policyIdsWithAdmin = new Set(
    policies
      .filter(function (p) { return p && p.admin_access; })
      .map(function (p) { return toPolicyId(p.id); })
      .filter(Boolean)
  );

  function policyId(p) {
    return toPolicyId(p);
  }

  function policyIds(obj) {
    var pol = obj.policies || obj.policy || [];
    return Array.isArray(pol) ? pol : (pol && (pol.id || pol.policy) ? [pol] : []);
  }

  var policyIdsWithAccess = new Set([].concat(
    Array.from(policyIdsFromPermissions).map(function (id) { return String(id); }),
    Array.from(policyIdsWithAdmin).map(function (id) { return String(id); })
  ));

  function hasAccessViaPolicies(policyList) {
    for (var i = 0; i < policyList.length; i++) {
      var pid = policyId(policyList[i]);
      if (pid && policyIdsWithAccess.has(pid)) return true;
    }
    return false;
  }

  function roleHasAccess(r) {
    return hasAccessViaPolicies(policyIds(r));
  }

  var roleIdsWithAccess = new Set(
    roles.filter(roleHasAccess).map(function (r) { return r.id; }).filter(Boolean)
  );

  function userHasAccess(u) {
    if (u.role && roleIdsWithAccess.has(u.role)) return true;
    return hasAccessViaPolicies(policyIds(u));
  }

  function userActive(u) {
    var s = u.status;
    if (s == null || s === undefined) return true;
    return String(s).toLowerCase() === "active";
  }

  var userIds = new Set(
    users
      .filter(function (u) { return userActive(u) && userHasAccess(u); })
      .map(function (u) { return u.id; })
      .filter(Boolean)
  );

  if (!userIds.has(widget.user_id)) {
    return [];
  }

  return items;
};
`.trim(),
              },
            } as any),
          );

          const opReadUsers = await directus.request(
            createOperation({
              flow: flowId,
              key: "read_users",
              type: opTypes.readData,
              name: "Read users",
              position_x: 40,
              position_y: 0,
              resolve: (opScript as any),
              options: {
                collection: "directus_users",
                permissions: "$full",
                emitEvents: false,
                query: {
                  limit: -1,
                  fields: ["id", "role", "status", "policies.policy"],
                },
              },
            } as any),
          );

          const opReadRoles = await directus.request(
            createOperation({
              flow: flowId,
              key: "read_roles",
              type: opTypes.readData,
              name: "Read roles",
              position_x: 30,
              position_y: 0,
              resolve: (opReadUsers as any),
              options: {
                collection: "directus_roles",
                permissions: "$full",
                emitEvents: false,
                query: { limit: -1, fields: ["id", "policies.policy"] },
              },
            } as any),
          );

          const opReadPolicies = await directus.request(
            createOperation({
              flow: flowId,
              key: "read_policies",
              type: opTypes.readData,
              name: "Read policies",
              position_x: 20,
              position_y: 0,
              resolve: (opReadRoles as any),
              options: {
                collection: "directus_policies",
                permissions: "$full",
                emitEvents: false,
                query: { limit: -1, fields: ["id", "admin_access"] },
              },
            } as any),
          );

          const opReadPermissions = await directus.request(
            createOperation({
              flow: flowId,
              key: "read_permissions",
              type: opTypes.readData,
              name: "Read permissions",
              position_x: 10,
              position_y: 0,
              resolve: (opReadPolicies as any),
              options: {
                collection: "directus_permissions",
                permissions: "$full",
                emitEvents: false,
                query: {
                  limit: -1,
                  fields: ["collection", "policy", "action"],
                },
              },
            } as any),
          );

          const opReadWidget = await directus.request(
            createOperation({
              flow: flowId,
              key: "widget_config",
              type: opTypes.readData,
              name: "Read widget config",
              position_x: 0,
              position_y: 0,
              resolve: (opReadPermissions as any),
              options: {
                collection: APP_WIDGET_CONFIG_COLLECTION,
                permissions: "$full",
                emitEvents: false,
                query: {
                  limit: 1,
                  filter: {
                    // GET-only: widget_id comes from querystring via extract_query
                    id: "{{ extract_query.widget_id }}",
                  },
                },
              },
            } as any),
          );

          const opReadWidgetId =
            (opReadWidget as { id?: string })?.id ??
            (opReadWidget as { data?: { id?: string } })?.data?.id;
          if (!opReadWidgetId)
            throw new Error("Read widget config operation created but no id");

          // Add handshake branching + GET-only widget_id extraction for new flows too
          const opHandshake = await directus.request(
            createOperation({
              flow: flowId,
              key: "handshake",
              type: opTypes.runScript,
              name: "Handshake (version + supports)",
              position_x: 60,
              position_y: -80,
              resolve: null,
              options: {
                code: `
module.exports = async function () {
  return { version: ${APP_WIDGET_FLOW_VERSION}, supports: ${JSON.stringify(APP_WIDGET_SUPPORTED)} };
};`.trim(),
              },
            } as any),
          );
          const opWidgetIdPresent = await directus.request(
            createOperation({
              flow: flowId,
              key: "widget_id_present",
              type: opTypes.condition,
              name: "widget_id present?",
              position_x: 40,
              position_y: -40,
              resolve: opReadWidgetId,
              reject: (opHandshake as any).id,
              options: {
                filter: { extract_query: { widget_id: { _nnull: true } } },
              },
            } as any),
          );
          const opExtractQuery = await directus.request(
            createOperation({
              flow: flowId,
              key: "extract_query",
              type: opTypes.runScript,
              name: "Extract widget_id from query",
              position_x: 20,
              position_y: -40,
              resolve: (opWidgetIdPresent as any).id,
              options: {
                code: `
module.exports = async function (data) {
  const q = (data && data.$trigger && data.$trigger.query) ? data.$trigger.query : {};
  const widget_id = q && q.widget_id != null ? String(q.widget_id) : null;
  const uuid = typeof widget_id === "string" ? widget_id.trim() : "";
  const is_uuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
  return { widget_id: is_uuid ? uuid : null };
};`.trim(),
              },
            } as any),
          );
          await directus.request(updateFlow(flowId, { operation: (opExtractQuery as any).id } as any));
        }

        // Create a policy that allows users to manage only their own widget rows.
        const actions = ["create", "read", "update", "delete"] as const;
        const permissionsPayload = actions.map((action) => {
          const base = {
            collection: APP_WIDGET_CONFIG_COLLECTION,
            action,
            validation: {},
            fields: ["id", "user_id", "collection", "filter", "sort", "limit"],
          } as Record<string, unknown>;

          if (action === "create") {
            base.presets = { user_id: "$CURRENT_USER" };
            base.permissions = {};
          } else {
            base.permissions = {
              _and: [{ user_id: { _eq: "$CURRENT_USER" } }],
            };
            base.presets = {};
          }
          return base;
        });

        const policy = await directus.request(
          createPolicy({
            name: WIDGET_POLICY_NAME,
            icon: "widgets",
            description:
              "Allows app users to manage their own widget configurations.",
            admin_access: false,
            app_access: false,
            permissions: permissionsPayload,
          } as any),
        );

        createdPolicyId =
          (policy as { id?: string })?.id ??
          (policy as { data?: { id?: string } })?.data?.id ??
          null;
      } catch (error) {
        try {
          if (createdPolicyId) {
            await directus.request(deletePolicy(createdPolicyId as any));
          }
        } catch {
          // ignore
        }
        try {
          if (createdFlowId) {
            await directus.request(deleteFlow(createdFlowId as any));
          }
        } catch {
          // ignore
        }
        try {
          if (createdCollection) {
            await directus.request(
              deleteCollection(APP_WIDGET_CONFIG_COLLECTION as any),
            );
          }
        } catch {
          // ignore
        }

        throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["collections"] });
      await queryClient.invalidateQueries({ queryKey: ["flows"] });
      await queryClient.invalidateQueries({ queryKey: ["policies"] });
      await queryClient.invalidateQueries({ queryKey: ["widgetCollectionExists"] });

      return { installed: true };
    },
  });
}

