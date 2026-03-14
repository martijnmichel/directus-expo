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
  updateFlow,
} from "@directus/sdk";
import Constants from "expo-constants";
import {
  APP_PUSH_DEVICES_COLLECTION,
  APP_PUSH_FLOW_NAME,
  PUSH_ENDPOINT_URL,
  PUSH_FLOW_OPERATION_TYPES,
} from "@/constants/push";

function getPushSecret(): string | undefined {
  return (Constants.expoConfig as { extra?: { pushSecret?: string } })?.extra
    ?.pushSecret;
}

const PUSH_FIELDS: Array<{
  field: string;
  type: string;
  meta: Record<string, unknown>;
}> = [
  {
    field: "token",
    type: "string",
    meta: { interface: "input", required: true },
  },
  {
    field: "platform",
    type: "string",
    meta: { interface: "select-dropdown", options: { choices: [{ text: "iOS", value: "ios" }, { text: "Android", value: "android" }] } },
  },
  {
    field: "subscriptions",
    type: "json",
    meta: { interface: "input-code", options: { language: "json" } },
  },
  {
    field: "user_id",
    type: "uuid",
    meta: {
      interface: "select-dropdown-m2o",
      special: ["directus_users"],
      required: true,
      note: "Owner of this device (set by app; used for multi-user per server).",
    },
  },
];

/**
 * Installs the app_push_devices collection and its fields (token, platform, subscriptions).
 * Requires admin. No relation to directus_users.
 */
export function useInstallPushSchema() {
  const { directus } = useAuth();
  const queryClient = useQueryClient();

  const PUSH_POLICY_NAME = "App push devices (read, create, update, delete)";

  return useMutation({
    mutationFn: async () => {
      if (!directus) throw new Error("Not authenticated");
      const [collections, flowsRaw] = await Promise.all([
        directus.request(readCollections()),
        directus.request(readFlows({ filter: { name: { _eq: APP_PUSH_FLOW_NAME } }, limit: 1 } as any)),
      ]);
      const collectionExists = Array.isArray(collections)
        ? collections.some(
          (c: { collection?: string }) =>
            c.collection === APP_PUSH_DEVICES_COLLECTION
        )
        : false;
      const allCollections = Array.isArray(collections)
        ? (collections as { collection?: string }[])
          .map((c) => c.collection)
          .filter(
            (name): name is string =>
              typeof name === "string" && !name.startsWith("directus_")
          )
        : [];
      const flowsList = Array.isArray(flowsRaw) ? flowsRaw : (flowsRaw as { data?: unknown[] })?.data ?? [];
      const flowExists = flowsList.length > 0;
      if (collectionExists && flowExists)
        return { installed: false, alreadyExists: true };

      // Best-effort cleanup if something fails mid-install.
      let createdCollection = false;
      let createdFlowId: string | null = null;
      let createdPolicyId: string | null = null;

      try {
        if (!collectionExists) {
          await directus.request(
            createCollection({
              collection: APP_PUSH_DEVICES_COLLECTION,
              meta: {
                icon: "notifications",
                note: "Push device tokens for custom push endpoint",
                hidden: false,
              },
              schema: { name: APP_PUSH_DEVICES_COLLECTION },
            } as any)
          );
          createdCollection = true;
          for (const f of PUSH_FIELDS) {
            await directus.request(
              createField(APP_PUSH_DEVICES_COLLECTION as any, {
                field: f.field,
                type: f.type,
                meta: f.meta,
              } as any)
            );
          }
        }

        if (!flowExists) {
          const pushSecret = getPushSecret();
          if (!pushSecret?.trim()) {
            throw new Error(
              "Push secret is not set. Add PUSH_SECRET (or EXPO_PUBLIC_PUSH_SECRET) in .env or EAS Secrets. See README or app.config.js."
            );
          }

          const flow = await directus.request(
            createFlow({
              name: APP_PUSH_FLOW_NAME,
              icon: "notifications",
              description:
                "Reads app_push_devices, filters by trigger collection/action and user access, sends token list to push endpoint.",
              status: "active",
              trigger: "event",
              options: {
                type: "action",
                scope: ["items.create", "items.update", "items.delete"],
                collections: allCollections,
              },
            } as any)
          );
          const flowId =
            (flow as { id?: string })?.id ??
            (flow as { data?: { id?: string } })?.data?.id;
          if (!flowId) throw new Error("Flow created but no id returned");
          createdFlowId = flowId;

          const opTypes = PUSH_FLOW_OPERATION_TYPES;

          // Build body so "tokens" is raw {{ filter_tokens }} (no quotes). Directus then
          // embeds the array as JSON; wrapping in quotes caused invalid trailing " and 400.
          const requestBody =
            '{"collection":"{{ $trigger.collection }}","event":"{{ $trigger.event }}","key":"{{ $trigger.key }}",' +
            '"payload":{"title":"Item {{ $trigger.event }}","body":"{{ $trigger.collection }} #{{ $trigger.key }}"},"tokens":{{ filter_tokens }}}';

          const opRequest = await directus.request(
            createOperation({
              flow: flowId,
              key: "send-push-request",
              type: opTypes.request,
              name: "Send to push endpoint",
              position_x: 120,
              position_y: 0,
              options: {
                url: PUSH_ENDPOINT_URL,
                method: "POST",
                headers: [
                  { header: "Content-Type", value: "application/json" },
                  {
                    header: "Authorization",
                    value: `Bearer ${pushSecret.trim()}`,
                  },
                ],
                body: requestBody,
              },
            } as any)
          );
          const opRequestId =
            (opRequest as { id?: string })?.id ??
            (opRequest as { data?: { id?: string } })?.data?.id;
          if (!opRequestId) throw new Error("Request operation created but no id");

          const filterScriptCode = `
module.exports = async function(data) {
  const trigger = (data && data.$trigger) ? data.$trigger : {};
  const collection = trigger.collection || '';
  const action = (trigger.event || '').split('.').pop() || '';

  function asArray(val) {
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object' && Array.isArray(val.data)) return val.data;
    return [];
  }
  const permissions = asArray(data.read_permissions);
  const policies = asArray(data.read_policies);
  const roles = asArray(data.read_roles);
  const users = asArray(data.read_users);
  const devices = asArray(data.read_devices);

  console.info('[push-flow] trigger', { collection, action, event: trigger.event });
  console.info('[push-flow] counts', {
    permissions: permissions.length,
    policies: policies.length,
    roles: roles.length,
    users: users.length,
    devices: devices.length,
  });

  function toPolicyId(p) {
    if (p == null) return null;
    if (typeof p === 'string') return p;
    if (typeof p === 'number') return String(p);
    if (typeof p === 'object') {
      var id = p.id || p.policy || p.directus_policies_id || null;
      if (id != null && typeof id === 'object') id = (id.id != null ? id.id : null);
      return id != null ? String(id) : null;
    }
    return null;
  }
  var policyIdsFromPermissions = new Set(
    permissions
      .filter(function(p) { return p && p.collection === collection && p.action === action; })
      .map(function(p) { return toPolicyId(p.policy); })
      .filter(Boolean)
  );
  var policyIdsWithAdmin = new Set(
    policies
      .filter(function(p) { return p && p.admin_access; })
      .map(function(p) { return toPolicyId(p.id); })
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
    Array.from(policyIdsFromPermissions).map(function(id) { return String(id); }),
    Array.from(policyIdsWithAdmin).map(function(id) { return String(id); })
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
  var roleIdsWithAccess = new Set(roles.filter(roleHasAccess).map(function(r) { return r.id; }).filter(Boolean));
  function userHasAccess(u) {
    if (u.role && roleIdsWithAccess.has(u.role)) return true;
    return hasAccessViaPolicies(policyIds(u));
  }
  var userIds = new Set(users.filter(userHasAccess).map(function(u) { return u.id; }).filter(Boolean));
  console.info('[push-flow] access', {
    policyIdsFromPermissions: policyIdsFromPermissions.size,
    policyIdsWithAdmin: policyIdsWithAdmin.size,
    roleIdsWithAccess: roleIdsWithAccess.size,
    userIds: userIds.size,
  });

  const out = [];
  for (var i = 0; i < devices.length; i++) {
    var d = devices[i];
    if (d.user_id && !userIds.has(d.user_id)) continue;
    var subs = d.subscriptions;
    if (!Array.isArray(subs)) continue;
    var entry = subs.find(function(s) { return s && s.collection === collection; });
    if (!entry || !entry[action]) continue;
    var token = d.token && String(d.token).trim();
    if (token && (d.platform === 'ios' || d.platform === 'android')) {
      out.push({ token: token, platform: d.platform });
    }
  }
  console.info('[push-flow] out', { tokens: out.length });
  return out;
};
`.trim();

          const opScript = await directus.request(
            createOperation({
              flow: flowId,
              key: "filter_tokens",
              type: opTypes.runScript,
              name: "Filter tokens by access and subscription",
              position_x: 100,
              position_y: 0,
              resolve: opRequestId,
              options: { code: filterScriptCode },
            } as any)
          );
          const opScriptId =
            (opScript as { id?: string })?.id ??
            (opScript as { data?: { id?: string } })?.data?.id;
          if (!opScriptId) throw new Error("Script operation created but no id");

          const opReadDevices = await directus.request(
            createOperation({
              flow: flowId,
              key: "read_devices",
              type: opTypes.readData,
              name: "Read push devices",
              position_x: 60,
              position_y: 0,
              resolve: opScriptId,
              options: {
                collection: APP_PUSH_DEVICES_COLLECTION,
                permissions: "$full",
                emitEvents: false,
                query: { limit: -1, fields: ["token", "platform", "subscriptions", "user_id"] },
              },
            } as any)
          );
          const opReadDevicesId =
            (opReadDevices as { id?: string })?.id ??
            (opReadDevices as { data?: { id?: string } })?.data?.id;
          if (!opReadDevicesId) throw new Error("Read devices operation created but no id");

          const opReadUsers = await directus.request(
            createOperation({
              flow: flowId,
              key: "read_users",
              type: opTypes.readData,
              name: "Read users",
              position_x: 40,
              position_y: 0,
              resolve: opReadDevicesId,
              options: {
                collection: "directus_users",
                permissions: "$full",
                emitEvents: false,
                query: { limit: -1, fields: ["id", "role", "policies.policy"] },
              },
            } as any)
          );
          const opReadUsersId =
            (opReadUsers as { id?: string })?.id ??
            (opReadUsers as { data?: { id?: string } })?.data?.id;
          if (!opReadUsersId) throw new Error("Read users operation created but no id");

          const opReadRoles = await directus.request(
            createOperation({
              flow: flowId,
              key: "read_roles",
              type: opTypes.readData,
              name: "Read roles",
              position_x: 20,
              position_y: 0,
              resolve: opReadUsersId,
              options: {
                collection: "directus_roles",
                permissions: "$full",
                emitEvents: false,
                query: { limit: -1, fields: ["id", "policies.policy"] },
              },
            } as any)
          );
          const opReadRolesId =
            (opReadRoles as { id?: string })?.id ??
            (opReadRoles as { data?: { id?: string } })?.data?.id;
          if (!opReadRolesId) throw new Error("Read roles operation created but no id");

          const opReadPolicies = await directus.request(
            createOperation({
              flow: flowId,
              key: "read_policies",
              type: opTypes.readData,
              name: "Read policies",
              position_x: 10,
              position_y: 0,
              resolve: opReadRolesId,
              options: {
                collection: "directus_policies",
                permissions: "$full",
                emitEvents: false,
                query: { limit: -1, fields: ["id", "admin_access"] },
              },
            } as any)
          );
          const opReadPoliciesId =
            (opReadPolicies as { id?: string })?.id ??
            (opReadPolicies as { data?: { id?: string } })?.data?.id;
          if (!opReadPoliciesId) throw new Error("Read policies operation created but no id");

          const opReadPermissions = await directus.request(
            createOperation({
              flow: flowId,
              key: "read_permissions",
              type: opTypes.readData,
              name: "Read permissions",
              position_x: 0,
              position_y: 0,
              resolve: opReadPoliciesId,
              options: {
                collection: "directus_permissions",
                permissions: "$full",
                emitEvents: false,
                query: { limit: -1, fields: ["collection", "policy", "action"] },
              },
            } as any)
          );
          const opReadPermissionsId =
            (opReadPermissions as { id?: string })?.id ??
            (opReadPermissions as { data?: { id?: string } })?.data?.id;
          if (!opReadPermissionsId) throw new Error("Read permissions operation created but no id");

          await directus.request(
            updateFlow(flowId, { operation: opReadPermissionsId } as any)
          );
        }

        // Create a policy with RUD (+ create) permissions for app_push_devices and assign to selected roles.
        // Item-level filter ensures each user only sees/updates their own device row(s); preset sets user_id on create.

        const actions = ["create", "read", "update", "delete"] as const;
        const permissionsPayload = actions.map((action) => {
          const base = {
            collection: APP_PUSH_DEVICES_COLLECTION,
            action,
            validation: {},
            fields: ["token", "platform", "subscriptions", "user_id", "id"],
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
            name: PUSH_POLICY_NAME,
            icon: "notifications",
            description:
              "Allows app users to register and manage their push device and subscriptions.",
            admin_access: false,
            app_access: false,

            permissions: permissionsPayload,
          } as any)
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
        } catch { }
        try {
          if (createdFlowId) {
            await directus.request(deleteFlow(createdFlowId as any));
          }
        } catch { }
        try {
          if (createdCollection) {
            await directus.request(
              deleteCollection(APP_PUSH_DEVICES_COLLECTION as any)
            );
          }
        } catch { }

        throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["pushCollectionExists"] });
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.invalidateQueries({ queryKey: ["policies"] });
      return { installed: true };
    },
  });
}
