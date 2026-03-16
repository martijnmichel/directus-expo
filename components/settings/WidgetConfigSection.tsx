import { Button } from "@/components/display/button";
import { Modal } from "@/components/display/modal";
import { Text, Muted } from "@/components/display/typography";
import {
  DirectusIcon,
  DirectusIconName,
} from "@/components/display/directus-icon";
import { Input } from "@/components/interfaces/input";
import { Horizontal, Vertical } from "@/components/layout/Stack";
import { useLocalStorage } from "@/state/local/useLocalStorage";
import { LocalStorageKeys } from "@/state/local/useLocalStorage";
import { useCallback, useEffect, useState } from "react";
import { View, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import type { LatestItemsWidgetConfig } from "@/widgets/latestItems/types";
import {
  getLatestItemsWidgetConfigs,
  addLatestItemsWidgetConfig,
  updateLatestItemsWidgetConfig,
  removeLatestItemsWidgetConfig,
} from "../../widgets/latestItems/storage";
import {
  writeLatestItemsWidgetConfigListToCache,
  removeLatestItemsWidgetPayloadFromCache,
} from "@/widgets/latestItems/sync";
import { useAuth } from "@/contexts/AuthContext";
import {
  APP_WIDGET_CONFIG_COLLECTION,
  APP_WIDGET_FLOW_NAME,
} from "@/constants/widget";
import { createItem, updateItem, deleteItem, readFlows } from "@directus/sdk";
import { DividerSubtitle } from "@/components/display/subtitle";
import { useInstallWidgetSchema } from "@/state/widget/installWidgetSchema";
import {
  useWidgetCollectionExists,
  useWidgetAccessOnly,
  isWidgetForbiddenError,
} from "@/state/widget/useWidgetCollection";

const DEFAULT_FIELDS = ["id", "title", "name", "date_updated", "date_created"];

function useWidgetConfigs() {
  const [configs, setConfigs] = useState<LatestItemsWidgetConfig[]>([]);
  const load = useCallback(async () => {
    const list = await getLatestItemsWidgetConfigs();
    setConfigs(list);
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { configs, reload: load };
}

export function WidgetConfigSection() {
  const { configs, reload } = useWidgetConfigs();
  const { directus, policyGlobals } = useAuth();
  const installMutation = useInstallWidgetSchema();
  const { data: activeApi } = useLocalStorage<{ url: string }>(
    LocalStorageKeys.DIRECTUS_API_ACTIVE
  );
  const isAdmin = policyGlobals?.admin_access === true;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<LatestItemsWidgetConfig> & { instanceUrl: string; collection: string }>({
    instanceUrl: activeApi?.url ?? "",
    collection: "",
    title: "",
    sort: "-date_updated",
    limit: 5,
    displayField: "",
    fields: DEFAULT_FIELDS,
  });
  const [saving, setSaving] = useState(false);

  const getWebhookUrlForInstance = useCallback(
    async (instanceUrl: string): Promise<string> => {
      if (!directus) throw new Error("Not authenticated with Directus");
      const flows = await directus.request(
        readFlows({
          filter: { name: { _eq: APP_WIDGET_FLOW_NAME } },
          limit: 1,
        } as any),
      );
      const list = Array.isArray(flows)
        ? flows
        : (((flows as { data?: unknown[] })?.data as unknown[]) ?? []);
      const id = (list[0] as { id?: string } | undefined)?.id;
      if (!id) {
        throw new Error(
          "Widget flow not found on this instance. Install the widget backend first.",
        );
      }
      const base = instanceUrl.replace(/\/+$/, "");
      return `${base}/flows/trigger/${id}`;
    },
    [directus],
  );

  const runFullSetupCheck = isAdmin === true;
  const {
    data: setup,
    isLoading: loadingExists,
    isError: setupError,
    refetch: refetchSetup,
  } = useWidgetCollectionExists(runFullSetupCheck);
  const {
    data: accessOnly,
    isLoading: loadingAccessOnly,
    refetch: refetchAccessOnly,
  } = useWidgetAccessOnly(!runFullSetupCheck);
  const widgetAccess = runFullSetupCheck ? setup?.access : accessOnly?.access;

  const openAdd = () => {
    setEditingId(null);
    setForm({
      instanceUrl: activeApi?.url ?? "",
      collection: "",
      title: "",
      sort: "-date_updated",
      limit: 5,
      displayField: "",
      fields: DEFAULT_FIELDS,
    });
    setModalOpen(true);
  };

  const openEdit = (c: LatestItemsWidgetConfig) => {
    setEditingId(c.id);
    setForm({
      id: c.id,
      instanceUrl: c.instanceUrl,
      instanceName: c.instanceName,
      collection: c.collection,
      title: c.title ?? "",
      sort: c.sort ?? "-date_updated",
      limit: c.limit ?? 5,
      displayField: c.displayField ?? "",
      fields: c.fields?.length ? c.fields : DEFAULT_FIELDS,
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.instanceUrl?.trim() || !form.collection?.trim()) return;
    setSaving(true);
    try {
      let widgetId: string | undefined = undefined;

      // For now, only support creating widget rows for the active API / current Directus client.
      if (!directus) {
        throw new Error("Not authenticated with Directus");
      }

      const webhookUrl =
        form.webhookUrl && form.webhookUrl.trim().length > 0
          ? form.webhookUrl
          : await getWebhookUrlForInstance(form.instanceUrl);

      if (editingId) {
        const existing = configs.find((c) => c.id === editingId);
        widgetId = existing?.widgetId;

        if (widgetId) {
          await directus.request(
            updateItem(APP_WIDGET_CONFIG_COLLECTION as any, widgetId, {
              collection: form.collection,
              sort: form.sort,
              limit: form.limit,
            } as any),
          );
        }

        await updateLatestItemsWidgetConfig(editingId, {
          instanceUrl: form.instanceUrl,
          instanceName: form.instanceName,
          collection: form.collection,
          title: form.title || undefined,
          sort: form.sort || undefined,
          limit: form.limit,
          displayField: form.displayField || undefined,
          fields: form.fields,
          widgetId,
          webhookUrl,
          type: "collection",
        });
      } else {
        const row = await directus.request(
          createItem(APP_WIDGET_CONFIG_COLLECTION as any, {
            collection: form.collection,
            sort: form.sort,
            limit: form.limit,
          } as any),
        );
        widgetId =
          (row as { id?: string })?.id ??
          (row as { data?: { id?: string } })?.data?.id;

        await addLatestItemsWidgetConfig({
          instanceUrl: form.instanceUrl,
          instanceName: form.instanceName,
          collection: form.collection,
          title: form.title,
          sort: form.sort,
          limit: form.limit,
          displayField: form.displayField,
          fields: form.fields,
          widgetId,
          webhookUrl,
          type: "collection",
        });
      }
      await writeLatestItemsWidgetConfigListToCache(
        await getLatestItemsWidgetConfigs()
      );
      await reload();
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const remove = (c: LatestItemsWidgetConfig) => {
    Alert.alert(
      "Remove widget",
      `Remove "${c.title || c.collection}" from home screen options?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (directus && c.widgetId) {
              await directus.request(
                deleteItem<any, any>(
                  APP_WIDGET_CONFIG_COLLECTION as any,
                  c.widgetId as any,
                ) as any,
              );
            }
            await removeLatestItemsWidgetConfig(c.id);
            await removeLatestItemsWidgetPayloadFromCache(c.id);
            await writeLatestItemsWidgetConfigListToCache(
              await getLatestItemsWidgetConfigs()
            );
            reload();
          },
        },
      ]
    );
  };

  const loading =
    (runFullSetupCheck && loadingExists) ||
    (!runFullSetupCheck && loadingAccessOnly);

  if (loading) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title="Widgets" icon="msWidgets" />
        <ActivityIndicator />
      </Vertical>
    );
  }

  if (runFullSetupCheck && setupError && !setup) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title="Widgets" icon="msWidgets" />
        <Text>
          Widget settings are currently unavailable. Please try again later.
        </Text>
      </Vertical>
    );
  }

  const haveSchema = setup?.collectionExists && setup?.flowExists;

  if (runFullSetupCheck && !haveSchema) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title="Widgets" icon="msWidgets" />
        <>
          {(setup?.issues?.includes("missing_collection") ||
            setup?.issues?.includes("missing_flow")) && (
            <Text>
              {setup?.issues?.includes("missing_collection") &&
              setup?.issues?.includes("missing_flow")
                ? "This instance is not set up for widgets yet. An admin can install the required schema and flow."
                : setup?.issues?.includes("missing_collection")
                  ? "The widget config collection is missing. An admin can install it."
                  : "The widget flow is missing. An admin can install it."}
            </Text>
          )}
          <Button
            onPress={() => installMutation.mutate()}
            disabled={installMutation.isPending}
            leftIcon={
              installMutation.isPending ? undefined : (
                <DirectusIcon name="add_circle" />
              )
            }
          >
            {installMutation.isPending
              ? "Installing widget backend..."
              : "Install widget backend"}
          </Button>
          {installMutation.isError && (
            <Text style={{ color: "red" }}>
              {(installMutation.error as Error).message}
            </Text>
          )}
        </>
      </Vertical>
    );
  }

  const accessForbidden = widgetAccess === "forbidden";
  if (!runFullSetupCheck && accessForbidden) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title="Widgets" icon="msWidgets" />
        <Text>
          You don't have permission to manage widgets. Ask an admin to grant
          access to app_widget_config.
        </Text>
        <Button
          onPress={() => {
            refetchSetup();
            refetchAccessOnly();
          }}
          variant="soft"
          style={{ marginTop: 8 }}
        >
          Check again
        </Button>
      </Vertical>
    );
  }

  return (
    <Vertical spacing="md">
      <DividerSubtitle title="Widgets" icon="msWidgets" />
      <Muted>
        Configure which collections native widgets can show. Install the widget
        backend once per Directus instance (requires admin), then add personal
        widget setups below.
      </Muted>
      <Horizontal style={{ flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        {configs.map((c) => (
          <View
            key={c.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: "rgba(0,0,0,0.04)",
              borderRadius: 8,
              marginBottom: 4,
              minWidth: 200,
            }}
          >
            <Pressable onPress={() => openEdit(c)} style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontWeight: "600" }}>
                {c.title || c.collection}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 12, opacity: 0.8 }}>
                {c.instanceName || c.instanceUrl} · {c.collection}
              </Text>
            </Pressable>
            <Horizontal spacing="xs">
              <Button variant="ghost" size="sm" onPress={() => openEdit(c)}>
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                colorScheme="error"
                onPress={() => remove(c)}
              >
                Delete
              </Button>
            </Horizontal>
          </View>
        ))}
      </Horizontal>
      <Button variant="soft" onPress={openAdd} leftIcon={<DirectusIcon name="add" />}>
        Add widget setup
      </Button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Modal.Content
          title={editingId ? "Edit widget" : "Add widget setup"}
          variant="default"
          actions={
            <Horizontal spacing="sm">
              <Button variant="ghost" onPress={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onPress={save}
                disabled={
                  saving || !form.instanceUrl?.trim() || !form.collection?.trim()
                }
              >
                {editingId ? "Save" : "Add"}
              </Button>
            </Horizontal>
          }
        >
          <ScrollView style={{ maxHeight: 400 }}>
            <Vertical spacing="md">
              <Input
                label="Collection"
                value={form.collection}
                onChangeText={(t) => setForm((f) => ({ ...f, collection: t }))}
                placeholder="e.g. articles"
                autoCapitalize="none"
              />
              <Input
                label="Title (optional)"
                value={form.title ?? ""}
                onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
                placeholder="Widget header"
              />
              <Input
                label="Sort"
                value={form.sort ?? ""}
                onChangeText={(t) => setForm((f) => ({ ...f, sort: t }))}
                placeholder="-date_updated"
              />
              <Input
                label="Limit"
                value={String(form.limit ?? 5)}
                onChangeText={(t) =>
                  setForm((f) => ({ ...f, limit: Number(t) || 5 }))
                }
                keyboardType="number-pad"
              />
              <Text style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                Columns and values match the collection table view (preset or all fields).
              </Text>
            </Vertical>
          </ScrollView>
        </Modal.Content>
      </Modal>
    </Vertical>
  );
}

