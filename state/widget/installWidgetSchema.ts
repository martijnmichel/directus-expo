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
  deleteOperation,
  deletePolicy,
  readCollections,
  readFieldsByCollection,
  readFlows,
  readPolicies,
  readOperations,
  readItems,
  updateFlow,
  updateField,
  updatePolicy,
} from "@directus/sdk";
import {
  APP_WIDGET_CONFIG_COLLECTION,
  APP_WIDGET_FLOW_NAME,
  APP_WIDGET_FLOW_VERSION,
  APP_WIDGET_SUPPORTED,
  APP_WIDGET_TYPE_LATEST_ITEMS,
  APP_WIDGET_TYPES,
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
        choices: APP_WIDGET_TYPES.map((t) => ({ text: t.label, value: t.value })),
      },
      required: true,
      note: "Widget type. Currently only 'latest-items' is supported.",
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
    field: "title",
    type: "string",
    meta: {
      interface: "input",
      required: false,
      note: "Optional display title for the widget (shown in the widget header).",
    },
  },
  {
    field: "fields",
    type: "json",
    meta: {
      interface: "input-code",
      options: { language: "json" },
      note: "Fields array for the widget query (e.g. [\"id\",\"title\"]).",
    },
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
      interface: "input",
      note: "Limit for the widget query.",
    },
  }
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
    data: [],
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
  try {
    const version = ${APP_WIDGET_FLOW_VERSION};
    const supports = ${JSON.stringify(APP_WIDGET_SUPPORTED)};
    const widget = data?.extract_widget_config?.widget ?? ((data.widget_config && Array.isArray(data.widget_config.data))
      ? data.widget_config.data[0]
      : (Array.isArray(data.widget_config) ? data.widget_config[0] : data.widget_config));
    if (!widget || !widget.user_id || !widget.collection) {
      return {
        ok: false,
        status: "invalid_config",
        version,
        supports,
        data: [],
        error: { code: "INVALID_WIDGET_CONFIG", message: "Missing user_id or collection on widget config." },
      };
    }
    if (widget.type && !supports.includes(String(widget.type))) {
      return {
        ok: false,
        status: "invalid_config",
        version,
        supports,
        data: [],
        error: { code: "UNSUPPORTED_WIDGET_TYPE", message: "Unsupported widget type." },
      };
    }

  function getFieldValueString(value) {
    if (value == null) return "";
    if (Array.isArray(value)) {
      return value.map(getFieldValueString).filter(Boolean).join(", ");
    }
    if (typeof value === "object") {
      try { return JSON.stringify(value); } catch { return "[Object]"; }
    }
    return String(value);
  }

  function getValuesAtPath(obj, path) {
    if (obj == null || !path) return [];
    var segments = String(path).split(".").filter(Boolean);
    if (segments.length === 0) return [obj];
    var key = segments[0];
    var rest = segments.slice(1);
    var restPath = rest.join(".");
    var val = (obj && typeof obj === "object" && key in obj) ? obj[key] : undefined;
    if (rest.length === 0) return val != null ? [val] : [];
    if (Array.isArray(val)) {
      var out = [];
      for (var i = 0; i < val.length; i++) {
        out = out.concat(getValuesAtPath(val[i], restPath));
      }
      return out;
    }
    return getValuesAtPath(val, restPath);
  }

  function toM2AReadPath(path) {
    var parts = String(path).split(".");
    if (parts.length < 4) return path;
    return parts.slice(0, 2).concat(parts.slice(3)).join(".");
  }

  function getJoinedLeafValuesAtPath(obj, path) {
    if (!obj || !path) return "";
    // Normalize Directus M2A colon syntax to dots for read.
    var normalized = String(path).replace(/(\\w+):/g, "$1.");
    var values = getValuesAtPath(obj, normalized);
    var flat = Array.isArray(values) ? values : [values];
    var leaf = flat.filter(function (v) { return v != null && typeof v !== "object"; });
    if (leaf.length === 0 && normalized.split(".").filter(Boolean).length >= 4) {
      values = getValuesAtPath(obj, toM2AReadPath(normalized));
      flat = Array.isArray(values) ? values : [values];
      leaf = flat.filter(function (v) { return v != null && typeof v !== "object"; });
    }
    return leaf.map(getFieldValueString).filter(Boolean).join(", ");
  }

  /** Default UI options for slots that support them (keep in sync with APP_WIDGET_LATEST_ITEMS_SLOTS). */
  function defaultSlotOptionsByKey(slotKey) {
    if (slotKey === "left" || slotKey === "right") {
      return { widthBehaviour: "fit", width: 24 };
    }
    return null;
  }

  var SLOT_OPTION_KEYS = { widthBehaviour: true, width: true };

  function mergeSlotOptions(slotKey, rawOpts) {
    var def = defaultSlotOptionsByKey(slotKey);
    if (!def) return null;
    var out = {};
    for (var dk in def) {
      if (Object.prototype.hasOwnProperty.call(def, dk)) out[dk] = def[dk];
    }
    if (rawOpts && typeof rawOpts === "object" && !Array.isArray(rawOpts)) {
      var wb = rawOpts.widthBehaviour;
      if (wb === "stretch" || rawOpts.stretch === true) {
        out.widthBehaviour = "fixed";
      } else if (wb === "fit" || wb === "fixed") {
        out.widthBehaviour = wb;
      }
      for (var rk in rawOpts) {
        if (!Object.prototype.hasOwnProperty.call(rawOpts, rk)) continue;
        if (!SLOT_OPTION_KEYS[rk]) continue;
        out[rk] = rawOpts[rk];
      }
      if (out.widthBehaviour !== "fit" && out.widthBehaviour !== "fixed") {
        out.widthBehaviour = "fixed";
      }
      if (out.widthBehaviour === "stretch") out.widthBehaviour = "fixed";
    }
    delete out.stretch;
    return out;
  }

  function normalizeSlots(extra) {
    var defaults = [
      { key: "left", label: "Left", field: "" },
      { key: "title", label: "Title", field: "" },
      { key: "subtitle", label: "Subtitle", field: "" },
      { key: "right", label: "Right", field: "" },
    ];
    var raw = extra && extra.slots && Array.isArray(extra.slots) ? extra.slots : [];
    var byKey = {};
    for (var i = 0; i < raw.length; i++) {
      var s = raw[i];
      if (!s || typeof s !== "object") continue;
      var k = s.key != null ? String(s.key) : "";
      if (!k) continue;
      byKey[k] = {
        key: k,
        label: s.label != null ? String(s.label) : k,
        field: s.field != null ? String(s.field) : "",
        options: s.options != null && typeof s.options === "object" && !Array.isArray(s.options) ? s.options : null,
      };
    }
    return defaults.map(function (d) {
      var base = byKey[d.key] || d;
      var merged = mergeSlotOptions(base.key, base.options);
      var row = { key: base.key, label: base.label, field: base.field };
      if (merged) row.options = merged;
      return row;
    });
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
  const relations = asArray(data.read_relations);
  const fieldsMeta = asArray(data.read_fields);
  const debugEnabled =
    !!(data && data.extract_query && (String(data.extract_query.debug || "").trim() === "1"));
  function debugLog(obj) {
    if (!debugEnabled) return;
    if (!data.__debug) data.__debug = {};
    for (var k in obj) data.__debug[k] = obj[k];
  }
  debugLog({
    counts: {
      permissions: permissions.length,
      policies: policies.length,
      roles: roles.length,
      users: users.length,
      items: items.length,
      relations: relations.length,
      fieldsMeta: fieldsMeta.length,
    },
  });

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
      data: [],
      error: { code: "FORBIDDEN", message: "Widget owner does not have read access to this collection." },
    };
  }

  function asStringArray(val) {
    if (val == null) return [];
    if (val && typeof val === "object" && Array.isArray(val.data)) return asStringArray(val.data);
    if (Array.isArray(val)) return val.map(function (v) { return v == null ? "" : String(v); }).filter(Boolean);
    if (typeof val === "string") {
      var s = val.trim();
      if (!s) return [];
      if (s.indexOf(",") >= 0) return s.split(",").map(function (x) { return String(x).trim(); }).filter(Boolean);
      return [s];
    }
    return [String(val)];
  }

  function getUserById(uid) {
    for (var i = 0; i < users.length; i++) if (users[i] && users[i].id === uid) return users[i];
    return null;
  }

  function getRoleById(rid) {
    for (var i = 0; i < roles.length; i++) if (roles[i] && roles[i].id === rid) return roles[i];
    return null;
  }

  function getPolicyIdListForUser(uid) {
    var u = getUserById(uid);
    if (!u) return [];
    var ids = [];
    // user policies
    var up = policyIds(u);
    for (var i = 0; i < up.length; i++) {
      var pid = toPolicyId(up[i]);
      if (pid) ids.push(pid);
    }
    // role policies
    if (u.role) {
      var r = getRoleById(u.role);
      if (r) {
        var rp = policyIds(r);
        for (var j = 0; j < rp.length; j++) {
          var rpid = toPolicyId(rp[j]);
          if (rpid) ids.push(rpid);
        }
      }
    }
    // de-dupe
    var seen = {};
    var out = [];
    for (var k = 0; k < ids.length; k++) {
      var v = String(ids[k]);
      if (!seen[v]) { seen[v] = true; out.push(v); }
    }
    return out;
  }

  function getAllowedFieldsForUserOnCollection(uid, col) {
    var pols = getPolicyIdListForUser(uid);
    // Admin access => allow all fields
    for (var i = 0; i < pols.length; i++) {
      if (policyIdsWithAdmin.has(String(pols[i]))) return null;
    }
    // Deny-by-default for nested collections: if there are no matching permission rows
    // for this user/policies+collection, we must not allow reading any fields.
    var allowed = new Set();
    var matched = false;
    for (var j = 0; j < permissions.length; j++) {
      var p = permissions[j];
      if (!p) continue;
      if (p.collection !== col) continue;
      if (p.action !== "read") continue;
      var pid = toPolicyId(p.policy);
      if (!pid) continue;
      if (pols.indexOf(String(pid)) === -1) continue;
      matched = true;
      // Mirror Directus semantics:
      // - fields: ["*"] => wildcard allow
      // - fields: [...] => explicit allow-list
      // - fields: [] or null/undefined => allow nothing
      if (p.fields == null) continue;
      var fields = asStringArray(p.fields);
      if (fields.length === 0) continue;
      for (var f = 0; f < fields.length; f++) {
        var name = String(fields[f] || "").trim();
        if (!name) continue;
        if (name === "*") return null; // wildcard => all fields
        allowed.add(name);
      }
    }
    if (!matched) return new Set(); // no permission row => deny all
    return allowed; // may be empty => deny all
  }

  function isFieldAllowed(allowedSetOrNull, fieldName) {
    if (!fieldName) return false;
    if (allowedSetOrNull == null) return true;
    // empty Set means deny all
    return allowedSetOrNull.has(fieldName);
  }

  function isPathAllowedForUser(uid, baseCol, path) {
    var p = String(path || "").trim();
    if (!p) return false;
    var currentCol = String(baseCol);
    var allowedByCol = {};
    function allowedFor(col) {
      var k = String(col);
      if (Object.prototype.hasOwnProperty.call(allowedByCol, k)) return allowedByCol[k];
      allowedByCol[k] = getAllowedFieldsForUserOnCollection(uid, k);
      return allowedByCol[k];
    }

    function findRelation(col, fieldName) {
      for (var i = 0; i < relations.length; i++) {
        var r = relations[i];
        if (!r) continue;
        var manyCol = (r.collection != null ? r.collection : r.many_collection);
        var manyField = (r.field != null ? r.field : r.many_field);
        if (manyCol === col && manyField === fieldName) return r;
      }
      return null;
    }

    function findAliasRelation(col, aliasField) {
      for (var i = 0; i < relations.length; i++) {
        var r = relations[i];
        if (!r) continue;
        var oneCol = (r.related_collection != null ? r.related_collection : r.one_collection);
        var oneField = (r.meta && r.meta.one_field != null ? r.meta.one_field : r.one_field);
        if (oneCol === col && oneField === aliasField) return r;
      }
      return null;
    }

    var translationsAliasByCollection = {};
    function isTranslationsAliasField(col, fieldName) {
      var key = String(col) + ":" + String(fieldName);
      if (Object.prototype.hasOwnProperty.call(translationsAliasByCollection, key)) {
        return translationsAliasByCollection[key] === true;
      }
      var isTrans = false;
      for (var i = 0; i < fieldsMeta.length; i++) {
        var f = fieldsMeta[i];
        if (!f) continue;
        var c = f.collection != null ? f.collection : f.many_collection;
        var ff = f.field != null ? f.field : f.many_field;
        if (c !== col || ff !== fieldName) continue;
        var iface = f.interface != null ? String(f.interface) : (f.meta && f.meta.interface != null ? String(f.meta.interface) : "");
        if (iface === "translations") { isTrans = true; break; }
        var sp = f.special != null ? f.special : (f.meta && f.meta.special != null ? f.meta.special : null);
        if (Array.isArray(sp)) {
          for (var j = 0; j < sp.length; j++) {
            if (String(sp[j]) === "translations") { isTrans = true; break; }
          }
          if (isTrans) break;
        }
      }
      translationsAliasByCollection[key] = isTrans;
      return isTrans;
    }

    function nextCollectionFromSegment(col, fieldName, nextFieldName) {
      // M2O / direct FK: relations.collection.field -> related_collection
      var direct = findRelation(col, fieldName);
      if (direct) {
        var related = (direct.related_collection != null ? direct.related_collection : direct.one_collection);
        if (related) return String(related);
      }

      // O2M / alias: relations.related_collection.meta.one_field -> relations.collection
      var alias = findAliasRelation(col, fieldName);
      var aliasManyCol = alias
        ? (alias.collection != null ? alias.collection : alias.many_collection)
        : null;
      if (!alias || !aliasManyCol) return null;

      // M2M/M2A alias has junction_field; resolve many-side to determine related collection
      var junctionFieldRaw =
        alias.meta && alias.meta.junction_field != null ? alias.meta.junction_field : alias.junction_field;
      if (junctionFieldRaw) {
        var junctionCollection = String(aliasManyCol);
        var junctionField = String(junctionFieldRaw);

        // Translations: alias points to the translations rows (many_collection) directly,
        // even though "junction_field" is set (usually languages_code).
        if (isTranslationsAliasField(col, fieldName)) {
          return String(aliasManyCol);
        }

        // Some M2M shapes return junction rows; the next segment is the junction FK field
        // (e.g. "test_m2m.pages_id.translations.title"). If that's the case, step into
        // the junction collection first so we validate "pages_id" against the right collection.
        if (nextFieldName && String(nextFieldName) === junctionField) {
          return junctionCollection;
        }

        var manySide = findRelation(junctionCollection, junctionField);
        if (manySide) {
          var related2 = (manySide.related_collection != null ? manySide.related_collection : manySide.one_collection);
          if (related2) return String(related2);
        }
        return null; // M2A handled via explicit ":collection" segments
      }

      return String(aliasManyCol);
    }

    var parts = p.split(".");
    for (var j = 0; j < parts.length; j++) {
      var seg = String(parts[j] || "");
      if (!seg) continue;
      var colon = seg.indexOf(":");
      var fieldName = (colon >= 0 ? seg.slice(0, colon) : seg).trim();
      if (!isFieldAllowed(allowedFor(currentCol), fieldName)) return false;
      if (colon >= 0) {
        var nextCol = seg.slice(colon + 1).trim();
        if (nextCol) currentCol = nextCol;
      } else {
        // Follow relation graph to validate subsequent segments against the correct collection
        var nextSeg = (j + 1 < parts.length) ? String(parts[j + 1] || "") : "";
        var nextColon = nextSeg.indexOf(":");
        var nextFieldName = (nextColon >= 0 ? nextSeg.slice(0, nextColon) : nextSeg).trim();
        var nc = nextCollectionFromSegment(currentCol, fieldName, nextFieldName);
        if (nc) {
          currentCol = nc;
        } else {
          // Safety: if there are more segments to evaluate but we can't resolve the relation hop,
          // deny the path to avoid leaking data under the wrong collection context.
          if (nextFieldName) return false;
        }
      }
    }
    return true;
  }

  function explainPath(uid, baseCol, path) {
    var p = String(path || "").trim();
    if (!p) return { ok: false, reason: "empty_path", steps: [] };
    var steps = [];
    var currentCol = String(baseCol);
    var allowedByCol = {};
    function allowedFor(col) {
      var k = String(col);
      if (Object.prototype.hasOwnProperty.call(allowedByCol, k)) return allowedByCol[k];
      allowedByCol[k] = getAllowedFieldsForUserOnCollection(uid, k);
      return allowedByCol[k];
    }

    // Duplicate relation-hop helpers here so debug mode can't crash on scoping.
    function findRelation(col, fieldName) {
      for (var i = 0; i < relations.length; i++) {
        var r = relations[i];
        if (!r) continue;
        var manyCol = (r.collection != null ? r.collection : r.many_collection);
        var manyField = (r.field != null ? r.field : r.many_field);
        if (manyCol === col && manyField === fieldName) return r;
      }
      return null;
    }

    function findAliasRelation(col, aliasField) {
      for (var i = 0; i < relations.length; i++) {
        var r = relations[i];
        if (!r) continue;
        var oneCol = (r.related_collection != null ? r.related_collection : r.one_collection);
        var oneField = (r.meta && r.meta.one_field != null ? r.meta.one_field : r.one_field);
        if (oneCol === col && oneField === aliasField) return r;
      }
      return null;
    }

    var translationsAliasByCollection = {};
    function isTranslationsAliasField(col, fieldName) {
      var key = String(col) + ":" + String(fieldName);
      if (Object.prototype.hasOwnProperty.call(translationsAliasByCollection, key)) {
        return translationsAliasByCollection[key] === true;
      }
      var isTrans = false;
      for (var i = 0; i < fieldsMeta.length; i++) {
        var f = fieldsMeta[i];
        if (!f) continue;
        var c = f.collection != null ? f.collection : f.many_collection;
        var ff = f.field != null ? f.field : f.many_field;
        if (c !== col || ff !== fieldName) continue;
        var iface = f.interface != null ? String(f.interface) : (f.meta && f.meta.interface != null ? String(f.meta.interface) : "");
        if (iface === "translations") { isTrans = true; break; }
        var sp = f.special != null ? f.special : (f.meta && f.meta.special != null ? f.meta.special : null);
        if (Array.isArray(sp)) {
          for (var j = 0; j < sp.length; j++) {
            if (String(sp[j]) === "translations") { isTrans = true; break; }
          }
          if (isTrans) break;
        }
      }
      translationsAliasByCollection[key] = isTrans;
      return isTrans;
    }

    function nextCollectionFromSegment(col, fieldName, nextFieldName) {
      var direct = findRelation(col, fieldName);
      if (direct) {
        var related = (direct.related_collection != null ? direct.related_collection : direct.one_collection);
        if (related) return String(related);
      }

      var alias = findAliasRelation(col, fieldName);
      var aliasManyCol = alias
        ? (alias.collection != null ? alias.collection : alias.many_collection)
        : null;
      if (!alias || !aliasManyCol) return null;

      var junctionFieldRaw =
        alias.meta && alias.meta.junction_field != null ? alias.meta.junction_field : alias.junction_field;
      if (junctionFieldRaw) {
        var junctionCollection = String(aliasManyCol);
        var junctionField = String(junctionFieldRaw);

        if (isTranslationsAliasField(col, fieldName)) {
          return String(aliasManyCol);
        }

        if (nextFieldName && String(nextFieldName) === junctionField) {
          return junctionCollection;
        }

        var manySide = findRelation(junctionCollection, junctionField);
        if (manySide) {
          var related2 = (manySide.related_collection != null ? manySide.related_collection : manySide.one_collection);
          if (related2) return String(related2);
        }
        return null;
      }

      return String(aliasManyCol);
    }

    var parts = p.split(".");
    for (var j = 0; j < parts.length; j++) {
      var seg = String(parts[j] || "");
      var colon = seg.indexOf(":");
      var fieldName = (colon >= 0 ? seg.slice(0, colon) : seg).trim();
      var allowedSet = allowedFor(currentCol);
      var allowed = isFieldAllowed(allowedSet, fieldName);
      steps.push({ col: currentCol, field: fieldName, allowed: allowed, wildcard: allowedSet == null });
      if (!allowed) return { ok: false, reason: "field_denied", steps: steps };
      if (colon >= 0) {
        var nextCol = seg.slice(colon + 1).trim();
        if (nextCol) currentCol = nextCol;
      } else {
        var nextSeg = (j + 1 < parts.length) ? String(parts[j + 1] || "") : "";
        var nextColon = nextSeg.indexOf(":");
        var nextFieldName = (nextColon >= 0 ? nextSeg.slice(0, nextColon) : nextSeg).trim();
        var nc = nextCollectionFromSegment(currentCol, fieldName, nextFieldName);
        steps.push({ hopFrom: currentCol, via: fieldName, hopTo: nc || null });
        if (nc) currentCol = nc;
        else if (nextFieldName) return { ok: false, reason: "unresolved_hop", steps: steps };
      }
    }
    return { ok: true, reason: null, steps: steps };
  }

  function specialTokens(fieldMeta) {
    var out = [];
    if (!fieldMeta || typeof fieldMeta !== "object") return out;
    var top = fieldMeta.special != null ? fieldMeta.special : null;
    var metaSp = fieldMeta.meta && fieldMeta.meta.special != null ? fieldMeta.meta.special : null;
    var src = [];
    if (Array.isArray(top)) src = src.concat(top);
    else if (top != null) src.push(top);
    if (Array.isArray(metaSp)) src = src.concat(metaSp);
    else if (metaSp != null) src.push(metaSp);
    for (var i = 0; i < src.length; i++) {
      var token = String(src[i] == null ? "" : src[i]).trim().toLowerCase();
      if (token) out.push(token);
    }
    return out;
  }

  function getFieldMeta(col, fieldName) {
    for (var i = 0; i < fieldsMeta.length; i++) {
      var f = fieldsMeta[i];
      if (!f) continue;
      var c = f.collection != null ? f.collection : f.many_collection;
      var ff = f.field != null ? f.field : f.many_field;
      if (String(c) === String(col) && String(ff) === String(fieldName)) return f;
    }
    return null;
  }

  function parsePathAndTransform(path) {
    var p = String(path || "").trim();
    if (!p) return { path: "", transform: null };
    var parts = p.split(".").map(function (x) { return String(x || "").trim(); }).filter(Boolean);
    var transform = null;
    var baseParts = [];
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part.charAt(0) === "$") {
        if (!transform) transform = part.slice(1).toLowerCase();
        continue;
      }
      baseParts.push(part);
    }
    return { path: baseParts.join("."), transform: transform };
  }

  function inferSlotTypeFromPath(baseCol, path) {
    var parsed = parsePathAndTransform(path);
    var p = parsed.path;
    var transform = parsed.transform;
    if (!p) return "string";
    if (transform) return transform;

    function findRelation(col, fieldName) {
      for (var i = 0; i < relations.length; i++) {
        var r = relations[i];
        if (!r) continue;
        var manyCol = (r.collection != null ? r.collection : r.many_collection);
        var manyField = (r.field != null ? r.field : r.many_field);
        if (String(manyCol) === String(col) && String(manyField) === String(fieldName)) return r;
      }
      return null;
    }

    function findAliasRelation(col, aliasField) {
      for (var i = 0; i < relations.length; i++) {
        var r = relations[i];
        if (!r) continue;
        var oneCol = (r.related_collection != null ? r.related_collection : r.one_collection);
        var oneField = (r.meta && r.meta.one_field != null ? r.meta.one_field : r.one_field);
        if (String(oneCol) === String(col) && String(oneField) === String(aliasField)) return r;
      }
      return null;
    }

    function isTranslationsAliasField(col, fieldName) {
      var f = getFieldMeta(col, fieldName);
      if (!f) return false;
      var iface = f.interface != null ? String(f.interface).toLowerCase() : (f.meta && f.meta.interface != null ? String(f.meta.interface).toLowerCase() : "");
      if (iface === "translations") return true;
      var sp = specialTokens(f);
      return sp.indexOf("translations") >= 0;
    }

    function nextCollectionFromSegment(col, fieldName, nextFieldName) {
      var direct = findRelation(col, fieldName);
      if (direct) {
        var related = (direct.related_collection != null ? direct.related_collection : direct.one_collection);
        if (related) return String(related);
      }
      var alias = findAliasRelation(col, fieldName);
      var aliasManyCol = alias
        ? (alias.collection != null ? alias.collection : alias.many_collection)
        : null;
      if (!alias || !aliasManyCol) return null;

      var junctionFieldRaw =
        alias.meta && alias.meta.junction_field != null ? alias.meta.junction_field : alias.junction_field;
      if (junctionFieldRaw) {
        var junctionCollection = String(aliasManyCol);
        var junctionField = String(junctionFieldRaw);
        if (isTranslationsAliasField(col, fieldName)) return String(aliasManyCol);
        if (nextFieldName && String(nextFieldName) === junctionField) return junctionCollection;
        var manySide = findRelation(junctionCollection, junctionField);
        if (manySide) {
          var related2 = (manySide.related_collection != null ? manySide.related_collection : manySide.one_collection);
          if (related2) return String(related2);
        }
        return null;
      }
      return String(aliasManyCol);
    }

    var currentCol = String(baseCol);
    var parts = p.split(".");
    var lastField = "";
    for (var j = 0; j < parts.length; j++) {
      var seg = String(parts[j] || "").trim();
      if (!seg) continue;
      var colon = seg.indexOf(":");
      var fieldName = (colon >= 0 ? seg.slice(0, colon) : seg).trim();
      if (fieldName) lastField = fieldName;
      if (colon >= 0) {
        var explicitCol = seg.slice(colon + 1).trim();
        if (explicitCol) currentCol = explicitCol;
      } else {
        var nextSeg = (j + 1 < parts.length) ? String(parts[j + 1] || "") : "";
        var nextColon = nextSeg.indexOf(":");
        var nextFieldName = (nextColon >= 0 ? nextSeg.slice(0, nextColon) : nextSeg).trim();
        var nc = nextCollectionFromSegment(currentCol, fieldName, nextFieldName);
        if (nc) currentCol = nc;
      }
    }

    if (!lastField) return "string";
    var fm = getFieldMeta(currentCol, lastField);
    if (!fm) return "string";

    var iface = fm.interface != null ? String(fm.interface).toLowerCase() : (fm.meta && fm.meta.interface != null ? String(fm.meta.interface).toLowerCase() : "");
    var specials = specialTokens(fm);

    if (specials.indexOf("status") >= 0 || String(lastField).toLowerCase() === "status") return "status";
    if (specials.indexOf("file") >= 0 || specials.indexOf("files") >= 0 || specials.indexOf("directus_files") >= 0) return "image";
    if (iface.indexOf("file") >= 0 || iface.indexOf("image") >= 0) return "image";
    if (iface === "datetime" || iface === "date" || iface === "time") return "date";
    return "string";
  }

  function extractFileId(value) {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (typeof value === "object") {
      var id =
        value.id != null ? value.id
          : (value.directus_files_id != null ? value.directus_files_id : null);
      if (id != null && typeof id === "object") {
        if (id.id != null) id = id.id;
      }
      return id != null ? String(id) : "";
    }
    return "";
  }

  // ─── Per-slot value resolver (generic, shared by all types that use slots) ──
  function resolveSlotValue(it, slotField) {
    var parsed = parsePathAndTransform(slotField || "");
    var path = parsed.path;
    var transform = parsed.transform;
    if (!path) return "";
    if (!isPathAllowedForUser(widget.user_id, collection, path)) return "";
    if (transform) {
      // For transforms the raw value may be a file object {id, ...} — extract just the ID.
      var norm = String(path).replace(/(\\w+):/g, "$1.");
      var rawValues = getValuesAtPath(it, norm);
      var rawFlat = Array.isArray(rawValues) ? rawValues : [rawValues];
      var rawVal = null;
      for (var ri = 0; ri < rawFlat.length; ri++) { if (rawFlat[ri] != null) { rawVal = rawFlat[ri]; break; } }
      return rawVal != null ? extractFileId(rawVal) : "";
    }
    return getJoinedLeafValuesAtPath(it, path) || "";
  }

  function resolveSlotDebug(path, transform) {
    if (!debugEnabled) return;
    if (!data.__debug_paths) data.__debug_paths = [];
    if (data.__debug_paths.length < 25) {
      data.__debug_paths.push({ path: path, transform: transform, check: explainPath(widget.user_id, collection, path) });
    }
  }

  // ─── Per-type response formatter ─────────────────────────────────────────────
  // Each case receives the permission-filtered items and returns the typed data
  // payload for the widget response.  Add a new "case" for each new widget type.
  function formatItemsForType(widgetType, rawExtra) {
    switch (widgetType) {
      case "latest-items":
      default: {
        var slots = normalizeSlots(rawExtra || {});
        var formatted = (Array.isArray(items) ? items : []).map(function (it) {
          var id = it && (it.id != null ? String(it.id) : "");
          var values = slots.reduce(function (acc, s) {
            var field = (s && s.field != null) ? String(s.field) : "";
            if (!field.trim()) return acc;
            var parsed = parsePathAndTransform(field);
            resolveSlotDebug(parsed.path, parsed.transform);
            var row = {
              slot: s.key,
              type: inferSlotTypeFromPath(collection, field),
              value: resolveSlotValue(it, field),
            };
            // Layout options (widthBehaviour / width) apply only to left & right; title & subtitle always use remaining width.
            if (
              s.options &&
              typeof s.options === "object" &&
              (s.key === "left" || s.key === "right")
            ) {
              row.options = s.options;
            }
            acc.push(row);
            return acc;
          }, []);
          return { id: id, values: values };
        });
        return [{ type: "latest-items", items: formatted }];
      }
    }
  }

  var widgetType = widget.type != null ? String(widget.type) : "latest-items";
  var responseData = formatItemsForType(widgetType, widget.extra || {});

  var faviconId = null;
  try {
    var sd = data.read_settings;
    var settingsRow = sd ? (Array.isArray(sd.data) ? sd.data[0] : (Array.isArray(sd) ? sd[0] : sd)) : null;
    if (settingsRow && settingsRow.public_favicon) faviconId = String(settingsRow.public_favicon);
  } catch (_) {}

  var resp = { ok: true, status: "ok", version, supports, data: responseData };
  if (faviconId) resp.favicon = faviconId;
  if (debugEnabled) resp.debug = data.__debug || { enabled: true };
  if (debugEnabled && data.__debug_paths) resp.debug_paths = data.__debug_paths;
  return resp;
  } catch (e) {
    return {
      ok: false,
      status: "error",
      version: ${APP_WIDGET_FLOW_VERSION},
      supports: ${JSON.stringify(APP_WIDGET_SUPPORTED)},
      data: [],
      error: {
        code: "FLOW_ERROR",
        message: e && e.message ? String(e.message) : String(e),
        stack: e && e.stack ? String(e.stack) : null,
      },
    };
  }
};`.trim(),
            },
          } as any),
        );
        const filterItemsId = idOf(opFilterItems);
        if (!filterItemsId) throw new Error("Filter items operation created but no id");
        log("created op", "filter_items", filterItemsId);

        // Read Directus settings (public_favicon file ID).
        const opReadSettings = await directus.request(
          createOperation({
            flow: flowId,
            key: "read_settings",
            type: opTypes.readData,
            name: "Read settings",
            position_x: 70,
            position_y: 0,
            resolve: filterItemsId,
            options: {
              collection: "directus_settings",
              permissions: "$full",
              emitEvents: false,
              query: { limit: 1, fields: ["public_favicon"] },
            },
          } as any),
        );
        const readSettingsId = idOf(opReadSettings);
        if (!readSettingsId) throw new Error("Read settings operation created but no id");
        log("created op", "read_settings", readSettingsId);

        // Read the target collection items via Read Data, using normalized values (no `||` / no "undefined").
        const opReadCollection = await directus.request(
          createOperation({
            flow: flowId,
            key: "read_collection",
            type: opTypes.readData,
            name: "Read collection",
            position_x: 60,
            position_y: 0,
            resolve: readSettingsId,
            options: {
              collection: "{{ extract_widget_config.widget.collection }}",
              permissions: "$full",
              emitEvents: false,
              query: {
                limit: 10,
                sort: "{{ extract_widget_config.widget.sort }}",
                // Directus expects JSON for filter; provide a JSON string that parses to an object.
                filter: "{{ extract_widget_config.widget.filter_json }}",
                // Fields: pass as CSV string (Directus parses this; templated arrays are treated as literal field names)
                fields: "{{ extract_widget_config.widget.fields_csv }}",
              },
            },
          } as any),
        );
        const readCollectionId = idOf(opReadCollection);
        if (!readCollectionId) throw new Error("Read collection op created but no id");
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
              query: { limit: -1, fields: ["collection", "policy", "action", "fields"] },
            },
          } as any),
        );
        const readPermissionsId = idOf(opReadPermissions);
        if (!readPermissionsId)
          throw new Error("Read permissions operation created but no id");
        log("created op", "read_permissions", readPermissionsId);

        const opReadRelations = await directus.request(
          createOperation({
            flow: flowId,
            key: "read_relations",
            type: opTypes.readData,
            name: "Read relations",
            position_x: 0,
            position_y: 0,
            resolve: readPermissionsId,
            options: {
              collection: "directus_relations",
              permissions: "$full",
              emitEvents: false,
              query: {
                limit: -1,
                fields: [
                  "id",
                  "many_collection",
                  "many_field",
                  "one_collection",
                  "one_field",
                  "one_collection_field",
                  "one_allowed_collections",
                  "junction_field",
                  "sort_field",
                ],
              },
            },
          } as any),
        );
        const readRelationsId = idOf(opReadRelations);
        if (!readRelationsId) throw new Error("Read relations operation created but no id");
        log("created op", "read_relations", readRelationsId);

        const opReadFieldsMeta = await directus.request(
          createOperation({
            flow: flowId,
            key: "read_fields",
            type: opTypes.readData,
            name: "Read fields meta",
            position_x: -10,
            position_y: 0,
            resolve: readRelationsId,
            options: {
              collection: "directus_fields",
              permissions: "$full",
              emitEvents: false,
              query: {
                limit: -1,
                fields: ["collection", "field", "interface", "special"],
              },
            },
          } as any),
        );
        const readFieldsId = idOf(opReadFieldsMeta);
        if (!readFieldsId) throw new Error("Read fields meta operation created but no id");
        log("created op", "read_fields", readFieldsId);

        const opWidgetConfigOk = await directus.request(
          createOperation({
            flow: flowId,
            key: "widget_config_ok",
            type: opTypes.condition,
            name: "widget_config ok?",
            position_x: 30,
            position_y: -10,
            resolve: readFieldsId,
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
  try {
    const row = (data.widget_config && Array.isArray(data.widget_config.data))
      ? data.widget_config.data[0]
      : (Array.isArray(data.widget_config) ? data.widget_config[0] : data.widget_config);
    const widget = row && typeof row === "object" ? row : null;
    if (!widget) return { ok: false, reason: "missing_row", widget: null };
    if (!widget.user_id) return { ok: false, reason: "missing_user_id", widget };
    if (!widget.collection) return { ok: false, reason: "missing_collection", widget };

  // Normalize query inputs so templating never produces "undefined"
  // For latest-items we always fetch 10 rows (widgets can't scroll).
  const limit = 10;
  const sort = widget.sort != null && String(widget.sort).trim().length ? String(widget.sort) : "";
  const filter = (widget.filter && typeof widget.filter === "object") ? widget.filter : {};
  const extra = (widget.extra && typeof widget.extra === "object") ? widget.extra : {};

  const type = widget.type != null ? String(widget.type) : "";
  const supports = ["latest-items"];
  if (type && supports.indexOf(type) === -1) {
    return { ok: false, reason: "unsupported_type", widget };
  }

  // Strip $transform segments from a field path so only the real field path
  // is used when building the Directus fields query.
  function sanitizePath(p) {
    if (!p || typeof p !== "string") return "";
    return p.split(".").filter(Boolean).filter(function (seg) { return seg[0] !== "$"; }).join(".");
  }

  // ─── Per-type extra normalisation ───────────────────────────────────────────
  // Each widget type returns { normalizedExtra, fieldPaths } where fieldPaths
  // is the deduplicated list of base paths to request from Directus (no transforms).
  // Add a new "case" here when a new widget type is introduced.
  function defaultSlotOptionsByKey(slotKey) {
    if (slotKey === "left" || slotKey === "right") {
      return { widthBehaviour: "fit", width: 24 };
    }
    return null;
  }

  var SLOT_OPTION_KEYS_PUSH = { widthBehaviour: true, width: true };

  function mergeSlotOptions(slotKey, rawOpts) {
    var def = defaultSlotOptionsByKey(slotKey);
    if (!def) return null;
    var out = {};
    for (var dk in def) {
      if (Object.prototype.hasOwnProperty.call(def, dk)) out[dk] = def[dk];
    }
    if (rawOpts && typeof rawOpts === "object" && !Array.isArray(rawOpts)) {
      var wb = rawOpts.widthBehaviour;
      if (wb === "stretch" || rawOpts.stretch === true) {
        out.widthBehaviour = "fixed";
      } else if (wb === "fit" || wb === "fixed") {
        out.widthBehaviour = wb;
      }
      for (var rk in rawOpts) {
        if (!Object.prototype.hasOwnProperty.call(rawOpts, rk)) continue;
        if (!SLOT_OPTION_KEYS_PUSH[rk]) continue;
        out[rk] = rawOpts[rk];
      }
      if (out.widthBehaviour !== "fit" && out.widthBehaviour !== "fixed") {
        out.widthBehaviour = "fixed";
      }
      if (out.widthBehaviour === "stretch") out.widthBehaviour = "fixed";
    }
    delete out.stretch;
    return out;
  }

  function normalizeExtraForType(widgetType, rawExtra) {
    switch (widgetType) {
      case "latest-items":
      default: {
        var slotDefaults = [
          { key: "left",     label: "Left",     field: "" },
          { key: "title",    label: "Title",    field: "" },
          { key: "subtitle", label: "Subtitle", field: "" },
          { key: "right",    label: "Right",    field: "" },
        ];
        var raw = rawExtra && Array.isArray(rawExtra.slots) ? rawExtra.slots : [];
        var byKey = {};
        for (var i = 0; i < raw.length; i++) {
          var s = raw[i];
          if (!s || typeof s !== "object") continue;
          var k = s.key != null ? String(s.key) : "";
          if (!k) continue;
          byKey[k] = {
            key: k,
            label: s.label != null ? String(s.label) : k,
            field: s.field != null ? String(s.field) : "",
            options: s.options != null && typeof s.options === "object" && !Array.isArray(s.options) ? s.options : null,
          };
        }
        var slots = slotDefaults.map(function (d) {
          var base = byKey[d.key] || d;
          var merged = mergeSlotOptions(base.key, base.options);
          var row = { key: base.key, label: base.label, field: base.field };
          if (merged) row.options = merged;
          return row;
        });
        var paths = slots.map(function (sl) { return sanitizePath(sl.field); }).filter(Boolean);
        return { normalizedExtra: { slots: slots }, fieldPaths: paths };
      }
    }
  }

  var normalized = normalizeExtraForType(type, extra);
  var fieldsSet = new Set(["id"].concat(normalized.fieldPaths));
  var fields = Array.from(fieldsSet);
  const fields_csv = fields.map(String).join(",");

  return {
    ok: true,
    reason: null,
    widget: {
      ...widget,
      extra: normalized.normalizedExtra,
      limit,
      sort,
      filter,
      fields,
      fields_csv,
      filter_json: JSON.stringify(filter),
      fields_json: JSON.stringify(fields),
    },
  };
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      widget: null,
      error: {
        message: e && e.message ? String(e.message) : String(e),
        stack: e && e.stack ? String(e.stack) : null,
      },
    };
  }
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
                fields: [
                  "id",
                  "type",
                  "user_id",
                  "collection",
                  "fields",
                  "extra",
                  "filter",
                  "sort",
                  "limit",
                ],
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
  const debug = q && q.debug != null ? String(q.debug) : null;
  const uuid = typeof widget_id === "string" ? widget_id.trim() : "";
  const is_uuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
  return { widget_id: is_uuid ? uuid : null, debug: debug };
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
        // Ensure collection exists (create if missing)
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

        // Ensure required fields exist / are up-to-date (even if collection already existed).
        // We avoid touching primary key `id` on existing collections.
        try {
          const existingFieldsRaw = await directus.request(
            readFieldsByCollection(APP_WIDGET_CONFIG_COLLECTION as any),
          );
          const existingFields = Array.isArray(existingFieldsRaw)
            ? existingFieldsRaw
            : ((existingFieldsRaw as { data?: unknown[] })?.data ?? []);
          const existing = new Set(
            (existingFields as any[])
              .map((f) => String(f?.field ?? ""))
              .filter(Boolean),
          );

          for (const f of WIDGET_FIELDS) {
            if (f.field === "id") continue;
            if (existing.has(f.field)) continue;
            await directus.request(
              createField(APP_WIDGET_CONFIG_COLLECTION as any, {
                field: f.field,
                type: f.type,
                meta: f.meta,
              } as any),
            );
            log("created missing field", f.field);
          }

          // Keep the `type` dropdown choices aligned (safe meta-only update).
          if (existing.has("type")) {
            await directus.request(
              updateField(APP_WIDGET_CONFIG_COLLECTION as any, "type", {
                meta: {
                  interface: "select-dropdown",
                  options: {
                    choices: APP_WIDGET_TYPES.map((t) => ({ text: t.label, value: t.value })),
                  },
                  required: true,
                  note: "Widget type. Currently only 'latest-items' is supported.",
                },
              } as any),
            );
          }
        } catch (e: any) {
          // Don't fail install if field upsert fails; flow updates are still valuable.
          log("field upsert failed", String(e?.message ?? e ?? ""));
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
              options: { async: false, cacheEnabled: false, response_body: "$last" },
            } as any),
          );

          // Detach entrypoint before deleting operations (prevents FK/constraint issues on delete)
          try {
            await directus.request(
              updateFlow(existingFlowId, {
                operation: null,
                options: { async: false, cacheEnabled: false, response_body: "$last" },
              } as any),
            );
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
          await directus.request(
            updateFlow(existingFlowId, {
              operation: extractId,
              options: { async: false, cacheEnabled: false, response_body: "$last" },
            } as any),
          );
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
                cacheEnabled: false,
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
          await directus.request(
            updateFlow(flowId, {
              operation: extractId,
              options: { async: false, cacheEnabled: false, response_body: "$last" },
            } as any),
          );
        }

        // Create a policy that allows users to manage only their own widget rows.
        const actions = ["create", "read", "update", "delete"] as const;
        const permissionsPayload = actions.map((action) => {
          const base = {
            collection: APP_WIDGET_CONFIG_COLLECTION,
            action,
            validation: {},
            fields: ["id", "user_id", "collection", "title", "fields", "filter", "sort", "limit", "type"],
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

