import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  createCollection,
  createFlow,
  createOperation,
  createPolicy,
  deleteCollection,
  deleteFlow,
  deleteOperation,
  deletePolicy,
  readCollections,
  readFlows,
  readPolicies,
  readOperations,
  readItems,
  updateFlow,
  updatePolicy,
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
          } as any),
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
  const log = (...args: any[]) => {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      // eslint-disable-next-line no-console
      console.log("[widget-install]", ...args);
    }
  };
  const withTimeout = async <T,>(p: Promise<T>, ms: number, label: string): Promise<T> => {
    let t: any;
    const timeout = new Promise<T>((_, reject) => {
      t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms);
    });
    try {
      return await Promise.race([p, timeout]);
    } finally {
      clearTimeout(t);
    }
  };

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
      const existingFlowOperationId: string | null =
        flowExists ? ((flowsList[0] as any)?.operation ?? null) : null;

      log("collectionExists", collectionExists);
      log("flowExists", flowExists, "existingFlowId", existingFlowId);
      log("existingFlowOperationId", existingFlowOperationId);

      let createdCollection = false;
      let createdFlowId: string | null = null;
      let createdPolicyId: string | null = null;
      const opTypes = WIDGET_FLOW_OPERATION_TYPES;

      const idOf = (op: any): string | null =>
        (op as { id?: string })?.id ??
        (op as { data?: { id?: string } })?.data?.id ??
        null;

      const createCanonicalFlowOperations = async (flowId: string) => {
        log("createCanonicalFlowOperations", flowId);
        // Build the flow graph deterministically using only createOperation.
        // Avoid PATCH rewiring, which is brittle and can 400 on some Directus versions/setups.

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
  return {
    ok: true,
    status: "handshake",
    version: ${APP_WIDGET_FLOW_VERSION},
    supports: ${JSON.stringify(APP_WIDGET_SUPPORTED)},
  };
};`.trim(),
            },
          } as any),
        );
        const handshakeId = idOf(opHandshake);
        if (!handshakeId) throw new Error("Handshake operation created but no id");
        log("created op", "handshake", handshakeId);

        // Empty response for invalid/missing widget config (still includes data: [] for client contract)
        const opEmptyResponse = await directus.request(
          createOperation({
            flow: flowId,
            key: "empty_response",
            type: opTypes.runScript,
            name: "Empty response",
            position_x: 100,
            position_y: -80,
            resolve: null,
            options: {
              code: `
module.exports = async function (data) {
  const widgetId = data?.extract_query?.widget_id ?? null;
  const reason = data?.extract_widget_config?.reason ?? null;
  return {
    ok: false,
    status: "not_found",
    version: ${APP_WIDGET_FLOW_VERSION},
    supports: ${JSON.stringify(APP_WIDGET_SUPPORTED)},
    data: [{ type: "latest-items", items: [] }],
    error: {
      code: "WIDGET_NOT_FOUND",
      message: reason
        ? \`Widget config not usable (\${reason})\`
        : "Widget config not found or invalid.",
    },
    widget_id: widgetId,
  };
};`.trim(),
            },
          } as any),
        );
        const emptyResponseId = idOf(opEmptyResponse);
        if (!emptyResponseId) throw new Error("Empty response operation created but no id");
        log("created op", "empty_response", emptyResponseId);

        // Final response op for data path (returns the full webhook response object)
        const opFilterItems = await directus.request(
          createOperation({
            flow: flowId,
            key: "filter_items",
            type: opTypes.runScript,
            name: "Response (latest-items, permission filtered)",
            position_x: 80,
            position_y: 0,
            resolve: null,
            options: {
              code: `
module.exports = async function (data) {
  const version = ${APP_WIDGET_FLOW_VERSION};
  const supports = ${JSON.stringify(APP_WIDGET_SUPPORTED)};
  const widget = (data.widget_config && Array.isArray(data.widget_config.data))
    ? data.widget_config.data[0]
    : (Array.isArray(data.widget_config) ? data.widget_config[0] : data.widget_config);
  if (!widget || !widget.user_id || !widget.collection) {
    return {
      ok: false,
      status: "invalid_config",
      version,
      supports,
      data: [{ type: "latest-items", items: [] }],
      error: { code: "INVALID_WIDGET_CONFIG", message: "Missing user_id or collection on widget config." },
    };
  }
  if (widget.type && widget.type !== "collection") {
    return {
      ok: false,
      status: "invalid_config",
      version,
      supports,
      data: [{ type: "latest-items", items: [] }],
      error: { code: "UNSUPPORTED_WIDGET_TYPE", message: "Unsupported widget type." },
    };
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
      var pid = toPolicyId(policyList[i]);
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
    return {
      ok: false,
      status: "forbidden",
      version,
      supports,
      data: [{ type: "latest-items", items: [] }],
      error: { code: "FORBIDDEN", message: "Widget owner does not have read access to this collection." },
    };
  }

  return { ok: true, status: "ok", version, supports, data: [{ type: "latest-items", items }] };
};`.trim(),
            },
          } as any),
        );
        const filterItemsId = idOf(opFilterItems);
        if (!filterItemsId) throw new Error("Filter items operation created but no id");
        log("created op", "filter_items", filterItemsId);

        // Dynamic collection read (drives widget payload)
        const opReadCollection = await directus.request(
          createOperation({
            flow: flowId,
            key: "read_collection",
            type: opTypes.readData,
            name: "Read collection",
            position_x: 60,
            position_y: 0,
            resolve: filterItemsId,
            options: {
              collection: "{{ widget_config.collection }}",
              permissions: "$full",
              emitEvents: false,
              query: {
                limit: "{{ widget_config.limit || 10 }}",
                sort: "{{ widget_config.sort || '-date_updated' }}",
                filter: {},
              },
            },
          } as any),
        );
        const readCollectionId = idOf(opReadCollection);
        if (!readCollectionId)
          throw new Error("Read collection operation created but no id");
        log("created op", "read_collection", readCollectionId);

        const opReadUsers = await directus.request(
          createOperation({
            flow: flowId,
            key: "read_users",
            type: opTypes.readData,
            name: "Read users",
            position_x: 40,
            position_y: 0,
            resolve: readCollectionId,
            options: {
              collection: "directus_users",
              permissions: "$full",
              emitEvents: false,
              query: { limit: -1, fields: ["id", "role", "status", "policies.policy"] },
            },
          } as any),
        );
        const readUsersId = idOf(opReadUsers);
        if (!readUsersId) throw new Error("Read users operation created but no id");
        log("created op", "read_users", readUsersId);

        const opReadRoles = await directus.request(
          createOperation({
            flow: flowId,
            key: "read_roles",
            type: opTypes.readData,
            name: "Read roles",
            position_x: 30,
            position_y: 0,
            resolve: readUsersId,
            options: {
              collection: "directus_roles",
              permissions: "$full",
              emitEvents: false,
              query: { limit: -1, fields: ["id", "policies.policy"] },
            },
          } as any),
        );
        const readRolesId = idOf(opReadRoles);
        if (!readRolesId) throw new Error("Read roles operation created but no id");
        log("created op", "read_roles", readRolesId);

        const opReadPolicies = await directus.request(
          createOperation({
            flow: flowId,
            key: "read_policies",
            type: opTypes.readData,
            name: "Read policies",
            position_x: 20,
            position_y: 0,
            resolve: readRolesId,
            options: {
              collection: "directus_policies",
              permissions: "$full",
              emitEvents: false,
              query: { limit: -1, fields: ["id", "admin_access"] },
            },
          } as any),
        );
        const readPoliciesId = idOf(opReadPolicies);
        if (!readPoliciesId) throw new Error("Read policies operation created but no id");
        log("created op", "read_policies", readPoliciesId);

        const opReadPermissions = await directus.request(
          createOperation({
            flow: flowId,
            key: "read_permissions",
            type: opTypes.readData,
            name: "Read permissions",
            position_x: 10,
            position_y: 0,
            resolve: readPoliciesId,
            options: {
              collection: "directus_permissions",
              permissions: "$full",
              emitEvents: false,
              query: { limit: -1, fields: ["collection", "policy", "action"] },
            },
          } as any),
        );
        const readPermissionsId = idOf(opReadPermissions);
        if (!readPermissionsId)
          throw new Error("Read permissions operation created but no id");
        log("created op", "read_permissions", readPermissionsId);

        const opWidgetConfigOk = await directus.request(
          createOperation({
            flow: flowId,
            key: "widget_config_ok",
            type: opTypes.condition,
            name: "widget_config ok?",
            position_x: 30,
            position_y: -10,
            resolve: readPermissionsId,
            reject: emptyResponseId,
            options: {
              filter: { extract_widget_config: { ok: { _eq: true } } },
            },
          } as any),
        );
        const widgetConfigOkId = idOf(opWidgetConfigOk);
        if (!widgetConfigOkId) throw new Error("widget_config_ok operation created but no id");
        log("created op", "widget_config_ok", widgetConfigOkId);

        // Extract/validate widget_config row (so we can branch before read_collection runs)
        const opExtractWidgetConfig = await directus.request(
          createOperation({
            flow: flowId,
            key: "extract_widget_config",
            type: opTypes.runScript,
            name: "Extract widget config",
            position_x: 20,
            position_y: -10,
            resolve: widgetConfigOkId,
            options: {
              code: `
module.exports = async function (data) {
  const row = (data.widget_config && Array.isArray(data.widget_config.data))
    ? data.widget_config.data[0]
    : (Array.isArray(data.widget_config) ? data.widget_config[0] : data.widget_config);
  const widget = row && typeof row === "object" ? row : null;
  if (!widget) return { ok: false, reason: "missing_row", widget: null };
  if (!widget.user_id) return { ok: false, reason: "missing_user_id", widget };
  if (!widget.collection) return { ok: false, reason: "missing_collection", widget };
  return { ok: true, reason: null, widget };
};`.trim(),
            },
          } as any),
        );
        const extractWidgetConfigId = idOf(opExtractWidgetConfig);
        if (!extractWidgetConfigId)
          throw new Error("Extract widget config operation created but no id");
        log("created op", "extract_widget_config", extractWidgetConfigId);

        const opWidgetConfig = await directus.request(
          createOperation({
            flow: flowId,
            key: "widget_config",
            type: opTypes.readData,
            name: "Read widget config",
            position_x: 0,
            position_y: 0,
            resolve: extractWidgetConfigId,
            options: {
              collection: APP_WIDGET_CONFIG_COLLECTION,
              permissions: "$full",
              emitEvents: false,
              query: {
                limit: 1,
                fields: ["id", "type", "user_id", "collection", "filter", "sort", "limit"],
                filter: { id: { _eq: "{{ extract_query.widget_id }}" } },
              },
            },
          } as any),
        );
        const widgetConfigId = idOf(opWidgetConfig);
        if (!widgetConfigId) throw new Error("Widget config operation created but no id");
        log("created op", "widget_config", widgetConfigId);

        const opWidgetIdPresent = await directus.request(
          createOperation({
            flow: flowId,
            key: "widget_id_present",
            type: opTypes.condition,
            name: "widget_id present?",
            position_x: 40,
            position_y: -40,
            resolve: widgetConfigId,
            reject: handshakeId,
            options: { filter: { extract_query: { widget_id: { _nnull: true } } } },
          } as any),
        );
        const conditionId = idOf(opWidgetIdPresent);
        if (!conditionId) throw new Error("Condition operation created but no id");
        log("created op", "widget_id_present", conditionId);

        const opExtractQuery = await directus.request(
          createOperation({
            flow: flowId,
            key: "extract_query",
            type: opTypes.runScript,
            name: "Extract widget_id from query",
            position_x: 20,
            position_y: -40,
            resolve: conditionId,
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
        const extractId = idOf(opExtractQuery);
        if (!extractId) throw new Error("Extract query operation created but no id");
        log("created op", "extract_query", extractId);
        return { extractId };
      };

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
              // Define fields up-front so the PK is UUID (otherwise Directus auto-creates integer `id`)
              fields: WIDGET_FIELDS.map((f) => {
                if (f.field === "id") {
                  return {
                    field: "id",
                    type: "uuid",
                    meta: { ...f.meta, interface: "input" },
                    schema: {
                      data_type: "uuid",
                      is_primary_key: true,
                      is_unique: true,
                      is_nullable: false,
                      has_auto_increment: false,
                      default_value: null,
                    },
                  };
                }
                if (f.field === "user_id") {
                  return {
                    field: "user_id",
                    type: "uuid",
                    meta: { ...f.meta },
                    schema: {
                      data_type: "uuid",
                      is_primary_key: false,
                      is_unique: false,
                      is_nullable: false,
                      has_auto_increment: false,
                      default_value: null,
                      foreign_key_table: "directus_users",
                      foreign_key_column: "id",
                    },
                  };
                }
                return { field: f.field, type: f.type, meta: f.meta };
              }),
            } as any),
          );
          createdCollection = true;
        }

        // If the flow already exists: keep the SAME flow id, delete all operations, recreate canonical ops.
        // The widget stores the flow id natively, so we must never delete/recreate the flow itself.
        if (flowExists && existingFlowId) {
          log("update existing flow", existingFlowId);
          await directus.request(
            updateFlow(existingFlowId, {
              name: APP_WIDGET_FLOW_NAME,
              icon: "widgets",
              description:
                "Widget webhook (GET-only). GET with no params returns {version,supports}. GET with ?widget_id=... returns widget data.",
              status: "active",
              trigger: "webhook",
              options: { async: false, response_body: "$last" },
            } as any),
          );

          // Detach entrypoint before deleting operations (prevents FK/constraint issues on delete)
          try {
            await directus.request(updateFlow(existingFlowId, { operation: null } as any));
          } catch {
            // ignore; best effort
          }

          let opsRaw: unknown;
          try {
            log("list ops via sdk", existingFlowId);
            opsRaw = await directus.request(
              readOperations({
                filter: { flow: { _eq: existingFlowId } },
                limit: -1,
              } as any),
            );
          } catch (e: any) {
            const msg = String(e?.message ?? e ?? "");
            throw new Error(
              `Cannot list flow operations (directus_operations). ` +
                `Your token/role must be able to read operations to perform an in-place update. ` +
                `Original error: ${msg}`,
            );
          }

          const opsList = Array.isArray(opsRaw)
            ? opsRaw
            : ((opsRaw as { data?: unknown[] })?.data ?? []);
          log("ops found", opsList.length, (opsList as any[]).map((o) => o?.key).filter(Boolean));

          // Delete in a dependency-safe order:
          // If A.resolve/reject points to B, delete A before deleting B.
          const opsById = new Map<string, any>();
          const incoming = new Map<string, number>();
          const outgoing = new Map<string, string[]>();
          for (const op of opsList as any[]) {
            const id = op?.id ? String(op.id) : null;
            if (!id) continue;
            opsById.set(id, op);
            incoming.set(id, 0);
            outgoing.set(id, []);
          }
          for (const [id, op] of opsById.entries()) {
            const targets = [op?.resolve, op?.reject]
              .filter(Boolean)
              .map((t: any) => String(t))
              .filter((t: string) => opsById.has(t));
            outgoing.set(id, targets);
            for (const t of targets) {
              incoming.set(t, (incoming.get(t) ?? 0) + 1);
            }
          }

          const queue: string[] = [];
          for (const [id, cnt] of incoming.entries()) {
            if (cnt === 0) queue.push(id);
          }
          // Fallback: if graph has cycles, just append remaining ids.
          const ordered: string[] = [];
          while (queue.length) {
            const id = queue.shift()!;
            ordered.push(id);
            for (const t of outgoing.get(id) ?? []) {
              incoming.set(t, (incoming.get(t) ?? 0) - 1);
              if ((incoming.get(t) ?? 0) === 0) queue.push(t);
            }
          }
          for (const id of opsById.keys()) {
            if (!ordered.includes(id)) ordered.push(id);
          }

          let idx = 0;
          for (const opId of ordered) {
            idx += 1;
            const op = opsById.get(opId);
            const key = String(op?.key ?? "");
            log("delete op start", `${idx}/${ordered.length}`, key, opId);
            await withTimeout(
              directus.request(deleteOperation(opId as any)),
              10_000,
              `DELETE /operations/${opId}`,
            );
            log("delete op done", `${idx}/${ordered.length}`, key, opId);
          }

          log("verify ops deleted via sdk", existingFlowId);
          const remainingRaw = await directus.request(
            readOperations({
              filter: { flow: { _eq: existingFlowId } },
              limit: -1,
            } as any),
          );
          const remaining = Array.isArray(remainingRaw)
            ? remainingRaw
            : ((remainingRaw as { data?: unknown[] })?.data ?? []);
          log("ops remaining", remaining.length);
          if (remaining.length > 0) {
            const keys = (remaining as any[])
              .map((o) => String(o?.key ?? ""))
              .filter(Boolean)
              .slice(0, 20)
              .join(", ");
            throw new Error(
              `Failed to delete existing flow operations (${remaining.length} remaining). Keys: ${keys}`,
            );
          }

          const { extractId } = await createCanonicalFlowOperations(existingFlowId);
          await directus.request(updateFlow(existingFlowId, { operation: extractId } as any));
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

          const { extractId } = await createCanonicalFlowOperations(flowId);
          await directus.request(updateFlow(flowId, { operation: extractId } as any));
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

        // Only create policy once (avoid duplicating on each Update click)
        const existingPoliciesRaw = await directus.request(
          readPolicies({
            filter: { name: { _eq: WIDGET_POLICY_NAME } },
            limit: 1,
          } as any),
        );
        const existingPolicies = Array.isArray(existingPoliciesRaw)
          ? existingPoliciesRaw
          : ((existingPoliciesRaw as { data?: unknown[] })?.data ?? []);
        const existingPolicyId: string | null =
          (existingPolicies[0] as any)?.id ?? null;

        if (!existingPolicyId) {
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
        } else {
          await directus.request(
            updatePolicy(existingPolicyId as any, {
              name: WIDGET_POLICY_NAME,
              icon: "widgets",
              description:
                "Allows app users to manage their own widget configurations.",
              admin_access: false,
              app_access: false,
              permissions: permissionsPayload,
            } as any),
          );
          log("policy exists, updated", existingPolicyId);
        }
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
      await queryClient.invalidateQueries({ queryKey: ["widgetFlowExists"] });
      await queryClient.invalidateQueries({ queryKey: ["widgetFlowHandshake"] });

      return { installed: true };
    },
  });
}

