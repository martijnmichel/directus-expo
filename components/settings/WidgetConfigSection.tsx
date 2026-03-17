import { Button } from "@/components/display/button";
import { Modal } from "@/components/display/modal";
import { Text, Muted } from "@/components/display/typography";
import {
  DirectusIcon,
  DirectusIconName,
} from "@/components/display/directus-icon";
import { Input } from "@/components/interfaces/input";
import { Select } from "@/components/interfaces/select";
import { Horizontal, Vertical } from "@/components/layout/Stack";
import { useLocalStorage } from "@/state/local/useLocalStorage";
import { LocalStorageKeys } from "@/state/local/useLocalStorage";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import type { LatestItemsWidgetConfig } from "@/widgets/latestItems/types";
import {
  writeLatestItemsWidgetConfigListToCache,
  removeLatestItemsWidgetPayloadFromCache,
} from "@/widgets/latestItems/sync";
import {
  debugGetConfigListFromAppGroup,
  getConfigListFromAppGroup,
  getConfigListIdsFromAppGroup,
} from "@/widgets/shared/widgetCache";
import { requestAddWidgetToHomeScreen } from "@/widgets/shared/requestAddWidgetToHomeScreen";
import { useAuth } from "@/contexts/AuthContext";
import {
  APP_WIDGET_CONFIG_COLLECTION,
  APP_WIDGET_FLOW_NAME,
  APP_WIDGET_FLOW_VERSION,
  APP_WIDGET_SUPPORTED,
  APP_WIDGET_TYPE_LATEST_ITEMS,
  APP_WIDGET_TYPES,
} from "@/constants/widget";
import {
  createItem,
  updateItem,
  deleteItem,
  readFlows,
  readItems,
} from "@directus/sdk";
import { DividerSubtitle } from "@/components/display/subtitle";
import { useInstallWidgetSchema } from "@/state/widget/installWidgetSchema";
import {
  useWidgetCollectionExists,
  useWidgetAccessOnly,
  isWidgetForbiddenError,
  useFlowVersion,
} from "@/state/widget/useWidgetCollection";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "@/components/layout/Layout";
import { useCollections } from "@/state/queries/directus/core";
import { getCollectionTranslation } from "@/helpers/collections/getCollectionTranslation";
import { readFieldsByCollection } from "@directus/sdk";
import { useWidgetItems } from "@/state/widget/useWidgetItems";

const DEFAULT_FIELDS: string[] = [];

export function WidgetConfigSection() {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const { directus, policyGlobals, user } = useAuth();
  const { data: allCollections } = useCollections();
  const installMutation = useInstallWidgetSchema();
  const { data: activeApi } = useLocalStorage<{ url: string }>(
    LocalStorageKeys.DIRECTUS_API_ACTIVE,
  );
  const isAdmin = policyGlobals?.admin_access === true;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<
    Partial<LatestItemsWidgetConfig> & {
      instanceUrl: string;
      collection: string;
    }
  >({
    instanceUrl: activeApi?.url ?? "",
    collection: "",
    type: APP_WIDGET_TYPE_LATEST_ITEMS,
    title: "",
    sort: "-date_updated",
    limit: 5,
    displayField: "",
    fields: DEFAULT_FIELDS,
  });
  const [saving, setSaving] = useState(false);
  const [idsInAppGroup, setIdsInAppGroup] = useState<string[]>([]);
  const [syncingToWidgetId, setSyncingToWidgetId] = useState<string | null>(
    null,
  );
  const [sortOptions, setSortOptions] = useState<Array<{ value: string; text: string }>>([]);
  const flowVersionQuery = useFlowVersion(
    activeApi?.url ?? null,
    Platform.OS === "ios",
  );

  // Build collection options (non-hidden, non-directus_). Use same filtering as UserCollections.
  const collectionOptions =
    (Array.isArray(allCollections) ? allCollections : []) // SDK returns array
      .filter(
        (c: any) =>
          c &&
          typeof c.collection === "string" &&
          !c.collection.startsWith("directus_") &&
          !!c.meta &&
          !c.meta?.hidden &&
          !!c.schema,
      )
      .sort((a: any, b: any) => (Number(a?.meta?.sort ?? 0) - Number(b?.meta?.sort ?? 0)))
      .map((c: any) => ({
        value: String(c.collection),
        text: getCollectionTranslation(c, i18n.language) ?? String(c.collection),
      }));

  // Load fields for sort dropdown when collection changes (top-level only)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!directus || !form.collection) {
        setSortOptions([]);
        return;
      }
      try {
        const raw = await directus.request(readFieldsByCollection(form.collection as any));
        const list = Array.isArray(raw) ? raw : ((raw as any)?.data ?? []);
        const simple = (list as any[])
          .filter((f) => f && typeof f.field === "string")
          .filter((f) => !f.meta?.hidden)
          .filter((f) => !String(f.field).startsWith("_"))
          .filter((f) => !Array.isArray(f.meta?.special) || f.meta.special.length === 0); // avoid relations for now

        const opts: Array<{ value: string; text: string }> = [];
        for (const f of simple) {
          const name = String(f.field);
          opts.push({ value: `-${name}`, text: `${name} (desc)` });
          opts.push({ value: name, text: `${name} (asc)` });
        }
        if (!cancelled) setSortOptions(opts);
      } catch {
        if (!cancelled) setSortOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [directus, form.collection]);

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

  const widgetItemsQuery = useWidgetItems({
    enabled: widgetAccess === "ok",
  });
  const configs = widgetItemsQuery.data?.configs ?? [];

  const isLoadingSetup =
    (runFullSetupCheck && loadingExists) ||
    (!runFullSetupCheck && loadingAccessOnly) ||
    (widgetAccess === "ok" && widgetItemsQuery.isLoading);

  // Keep native widget config list in sync and refresh "synced" state for check icons
  useEffect(() => {
    if (configs.length > 0) {
      writeLatestItemsWidgetConfigListToCache(configs)
        .then(async () => {
          const readBack = await debugGetConfigListFromAppGroup();
          if (readBack != null) {
            setIdsInAppGroup(readBack.ids ?? []);
          } else {
            getConfigListIdsFromAppGroup().then(setIdsInAppGroup);
          }
        })
        .catch(() => getConfigListIdsFromAppGroup().then(setIdsInAppGroup));
    } else {
      setIdsInAppGroup([]);
    }
  }, [configs]);

  const openAdd = () => {
    setEditingId(null);
    setForm({
      instanceUrl: activeApi?.url ?? "",
      collection: "",
      type: APP_WIDGET_TYPE_LATEST_ITEMS,
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
      if (!user?.id) {
        throw new Error("Not authenticated (missing user)");
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
              type: form.type || APP_WIDGET_TYPE_LATEST_ITEMS,
              user_id: user.id,
              collection: form.collection,
              fields: form.fields,
              sort: form.sort,
              limit: form.limit,
              filter: {},
            } as any),
          );
        }

      } else {
        const row = await directus.request(
          createItem(
            APP_WIDGET_CONFIG_COLLECTION as any,
            {
              user_id: user.id,
              type: form.type || APP_WIDGET_TYPE_LATEST_ITEMS,
              collection: form.collection,
              fields: form.fields,
              sort: form.sort,
              limit: form.limit,
              filter: {},
            } as any,
          ),
        );
        widgetId =
          (row as { id?: string })?.id ??
          (row as { data?: { id?: string } })?.data?.id;
      }
      await widgetItemsQuery.refetch();
      setModalOpen(false);
      if (Platform.OS === "android" && !editingId) {
        const { requested } = await requestAddWidgetToHomeScreen();
        if (requested) {
          Alert.alert(
            t("widget.addConfirmTitle"),
            t("widget.addConfirmMessage"),
          );
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = (c: LatestItemsWidgetConfig) => {
    Alert.alert(
      t("widget.removeTitle"),
      t("widget.removeMessage", { name: c.title || c.collection }),
      [
        { text: t("button.cancel"), style: "cancel" },
        {
          text: t("widget.removeButton"),
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
            await removeLatestItemsWidgetPayloadFromCache(c.id);
            await widgetItemsQuery.refetch();
          },
        },
      ],
    );
  };

  const loading =
    (runFullSetupCheck && loadingExists) ||
    (!runFullSetupCheck && loadingAccessOnly);

  if (loading) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title={t("widget.title")} icon="msWidgets" />
        <ActivityIndicator />
      </Vertical>
    );
  }

  if (runFullSetupCheck && setupError && !setup) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title={t("widget.title")} icon="msWidgets" />
        <Text>{t("widget.unavailable")}</Text>
      </Vertical>
    );
  }

  const haveSchema = setup?.collectionExists && setup?.flowExists;

  if (runFullSetupCheck && !haveSchema) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title={t("widget.title")} icon="msWidgets" />
        <>
          {(setup?.issues?.includes("missing_collection") ||
            setup?.issues?.includes("missing_flow")) && (
            <Text>
              {setup?.issues?.includes("missing_collection") &&
              setup?.issues?.includes("missing_flow")
                ? t("widget.installHintBoth")
                : setup?.issues?.includes("missing_collection")
                  ? t("widget.installHintCollection")
                  : t("widget.installHintFlow")}
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
              ? t("widget.installing")
              : t("widget.installBackend")}
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
        <DividerSubtitle title={t("widget.title")} icon="msWidgets" />
        <Text>{t("widget.permissionWarning")}</Text>
        <Button
          onPress={() => {
            refetchSetup();
            refetchAccessOnly();
          }}
          variant="soft"
          style={{ marginTop: 8 }}
        >
          {t("widget.checkAgain")}
        </Button>
      </Vertical>
    );
  }

  return (
    <Vertical spacing="md">
      <DividerSubtitle title={t("widget.title")} icon="msWidgets" />
      <Muted>{t("widget.intro")}</Muted>
      {configs.length > 0 && (
        <View
          style={{
            marginTop: 8,
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: "rgba(0,0,0,0.04)",
            borderRadius: 8,
          }}
        >
          <Text style={{ fontWeight: "600", marginBottom: 4 }}>
            {t("widget.addToHomeScreenTitle")}
          </Text>
          <Muted style={{ marginBottom: 8 }}>
            {Platform.OS === "android"
              ? t("widget.addToHomeScreenHintAndroid")
              : t("widget.addToHomeScreenHintIos")}
          </Muted>
          {configs.length === 0 && (
            <Muted style={{ marginBottom: 8 }}>
              {t("widget.setupPickerHint")}
            </Muted>
          )}
          {Platform.OS === "android" && (
            <Button
              variant="soft"
              onPress={async () => {
                const { requested, error } =
                  await requestAddWidgetToHomeScreen();
                if (error) {
                  Alert.alert(t("widget.addErrorTitle"), error);
                } else if (requested) {
                  Alert.alert(
                    t("widget.addConfirmTitle"),
                    t("widget.addConfirmMessage"),
                  );
                }
              }}
              leftIcon={<DirectusIcon name="add" />}
            >
              {t("widget.addToHomeScreenButton")}
            </Button>
          )}
        </View>
      )}
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
              <Horizontal spacing="xs" style={{ alignItems: "center" }}>
                {idsInAppGroup.includes(c.id) && (
                  <View style={{ opacity: 0.7 }}>
                    <DirectusIcon name="check" size={16} />
                  </View>
                )}
                <View>
                  <Text numberOfLines={1} style={{ fontWeight: "600" }}>
                    {c.title || c.collection}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 12, opacity: 0.8 }}
                  >
                    {c.instanceName || c.instanceUrl} · {c.collection}
                  </Text>
                </View>
              </Horizontal>
            </Pressable>
            <Horizontal spacing="xs">
              {!idsInAppGroup.includes(c.id) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={async () => {
                    setSyncingToWidgetId(c.id);
                    try {
                      await writeLatestItemsWidgetConfigListToCache(configs);
                      const readBack = await getConfigListFromAppGroup();
                      if (readBack?.ids) setIdsInAppGroup(readBack.ids);
                    } finally {
                      setSyncingToWidgetId(null);
                    }
                  }}
                  disabled={syncingToWidgetId !== null}
                >
                  {syncingToWidgetId === c.id ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    t("widget.syncToWidget")
                  )}
                </Button>
              )}
              <Button variant="ghost" size="sm" onPress={() => openEdit(c)}>
                {t("widget.edit")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                colorScheme="error"
                onPress={() => remove(c)}
              >
                {t("widget.delete")}
              </Button>
            </Horizontal>
          </View>
        ))}
      </Horizontal>
      <Button
        variant="soft"
        onPress={openAdd}
        leftIcon={<DirectusIcon name="add" />}
      >
        {t("widget.addSetup")}
      </Button>

      {policyGlobals?.admin_access === true &&
        (flowVersionQuery.data?.needsUpdate || flowVersionQuery.isError) && (
          <Button
            variant="soft"
            disabled={!isAdmin || installMutation.isPending}
            onPress={() => installMutation.mutate()}
          >
            {installMutation.isPending
              ? "Updating…"
              : flowVersionQuery.isError
                ? "Install flow"
                : "Update flow"}
          </Button>
        )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Modal.Content
          variant="bottomSheet"
          height="70%"
          title={
            editingId ? t("widget.editModalTitle") : t("widget.addModalTitle")
          }
          actions={
            <Horizontal spacing="sm">
              <Button variant="ghost" onPress={() => setModalOpen(false)}>
                {t("button.cancel")}
              </Button>
              <Button
                onPress={save}
                disabled={
                  saving ||
                  !form.instanceUrl?.trim() ||
                  !form.collection?.trim()
                }
              >
                {editingId ? t("common.save") : t("widget.add")}
              </Button>
            </Horizontal>
          }
        >
          <KeyboardAwareScrollView>
            <Vertical spacing="md">
              <Select
                label="Type"
                value={form.type || APP_WIDGET_TYPE_LATEST_ITEMS}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, type: String(val) }))
                }
                options={APP_WIDGET_TYPES.map((t) => ({
                  value: t.value,
                  text: t.label,
                }))}
              />
              <Select
                label={t("widget.collectionLabel")}
                value={form.collection}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, collection: String(val) }))
                }
                options={collectionOptions}
                placeholder={t("widget.collectionPlaceholder")}
              />
              <Input
                label={t("widget.titleLabel")}
                value={form.title ?? ""}
                onChangeText={(val) => setForm((f) => ({ ...f, title: val }))}
                placeholder={t("widget.titlePlaceholder")}
              />
              <Select
                label={t("widget.sortLabel")}
                value={form.sort ?? ""}
                onValueChange={(val) => setForm((f) => ({ ...f, sort: String(val) }))}
                options={sortOptions.length ? sortOptions : [{ value: "-date_updated", text: "-date_updated (desc)" }]}
                placeholder={t("widget.sortPlaceholder")}
                disabled={!form.collection}
              />
              <Input
                label={t("widget.limitLabel")}
                value={String(form.limit ?? 5)}
                onChangeText={(val) =>
                  setForm((f) => ({ ...f, limit: Number(val) || 5 }))
                }
                keyboardType="number-pad"
              />
              <Text style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                {t("widget.columnsHint")}
              </Text>
            </Vertical>
          </KeyboardAwareScrollView>
        </Modal.Content>
      </Modal>
    </Vertical>
  );
}
