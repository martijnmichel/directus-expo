import { Button } from "@/components/display/button";
import { Text, Muted } from "@/components/display/typography";
import {
  DirectusIcon,
  DirectusIconName,
} from "@/components/display/directus-icon";
import { Horizontal, Vertical } from "@/components/layout/Stack";
import { useResolvedActiveSession } from "@/hooks/useResolvedActiveSession";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import {
  APP_WIDGET_CONFIG_COLLECTION,
  APP_WIDGET_FLOW_NAME,
  APP_WIDGET_FLOW_VERSION,
  APP_WIDGET_SUPPORTED,
  APP_WIDGET_TYPE_LATEST_ITEMS,
  APP_WIDGET_TYPES,
  buildDefaultLatestItemsFormSlots,
} from "@/constants/widget";
import {
  deleteItem,
  readFlows,
  readItems,
} from "@directus/sdk";
import { DividerSubtitle } from "@/components/display/subtitle";
import { Alert as InlineAlert } from "@/components/display/alert";
import { useInstallWidgetSchema } from "@/state/widget/installWidgetSchema";
import {
  useWidgetCollectionExists,
  useWidgetAccessOnly,
  isWidgetForbiddenError,
  useFlowVersion,
} from "@/state/widget/useWidgetCollection";
import { useTranslation } from "react-i18next";
import { useCollections } from "@/state/queries/directus/core";
import { getCollectionTranslation } from "@/helpers/collections/getCollectionTranslation";
import { useWidgetItems } from "@/state/widget/useWidgetItems";
import { listStyles } from "@/components/display/related-listitem";
import { useStyles } from "react-native-unistyles";
import { router } from "expo-router";
const DEFAULT_FIELDS: string[] = [];
const DEFAULT_SLOTS = buildDefaultLatestItemsFormSlots();

export function WidgetConfigSection() {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const { directus, policyGlobals, user } = useAuth();
  const { styles: listItemStyles } = useStyles(listStyles);
  const { data: allCollections } = useCollections();
  const installMutation = useInstallWidgetSchema();
  const { data: resolved } = useResolvedActiveSession();
  const { theme } = useStyles();
  const isAdmin = policyGlobals?.admin_access === true;
  const [idsInAppGroup, setIdsInAppGroup] = useState<string[]>([]);
  const [syncingToWidgetId, setSyncingToWidgetId] = useState<string | null>(
    null,
  );
  const flowVersionQuery = useFlowVersion(
    resolved?.api.url ?? null,
    Platform.OS === "ios",
  );

  // Build collection options (non-hidden, non-directus_). Use same filtering as UserCollections.
  const collectionOptions = (
    Array.isArray(allCollections) ? allCollections : []
  ) // SDK returns array
    .filter(
      (c: any) =>
        c &&
        typeof c.collection === "string" &&
        !c.collection.startsWith("directus_") &&
        !!c.meta &&
        !c.meta?.hidden &&
        !!c.schema,
    )
    .sort(
      (a: any, b: any) =>
        Number(a?.meta?.sort ?? 0) - Number(b?.meta?.sort ?? 0),
    )
    .map((c: any) => ({
      value: String(c.collection),
      text: getCollectionTranslation(c, i18n.language) ?? String(c.collection),
    }));

  // (Editor moved to /settings/widget/[id])

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
  const configIdsKey = useMemo(
    () =>
      configs
        .map((c) => c.id)
        .sort()
        .join("|"),
    [configs],
  );
  const lastSyncedIdsKeyRef = useRef<string>("");

  const isLoadingSetup =
    (runFullSetupCheck && loadingExists) ||
    (!runFullSetupCheck && loadingAccessOnly) ||
    (widgetAccess === "ok" && widgetItemsQuery.isLoading);

  // Refresh "synced" state for check icons (read-back from app group / shared prefs).
  useEffect(() => {
    let cancelled = false;

    // Avoid update loops: only refresh when the config id-set changes.
    if (lastSyncedIdsKeyRef.current === configIdsKey) return;
    lastSyncedIdsKeyRef.current = configIdsKey;

    (async () => {
      try {
        const readBack = await debugGetConfigListFromAppGroup();
        const ids = readBack?.ids ?? (await getConfigListIdsFromAppGroup());
        if (!cancelled) {
          setIdsInAppGroup((prev) => {
            const nextKey = [...ids].sort().join("|");
            const prevKey = [...prev].sort().join("|");
            return nextKey === prevKey ? prev : ids;
          });
        }
      } catch {
        if (!cancelled) setIdsInAppGroup((prev) => (prev.length ? prev : []));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [configIdsKey]);

  const openAdd = () => router.push("/settings/widget/new");
  const openEdit = (c: LatestItemsWidgetConfig) => router.push(`/settings/widget/${c.id}`);

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
            const refreshed = await widgetItemsQuery.refetch();
            await writeLatestItemsWidgetConfigListToCache(
              (refreshed.data as any)?.configs ?? [],
            );
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
      <InlineAlert
        status="info"
        message={
          Platform.OS === "android"
            ? t("widget.addToHomeScreenHintAndroid")
            : t("widget.addToHomeScreenHintIos")
        }
        action={undefined}
      />
      {configs.length === 0 && (
        <InlineAlert status="warning" message={t("widget.setupPickerHint")} />
      )}
      <Vertical spacing="xs" style={{ marginTop: 8 }}>
        {configs.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => openEdit(c)}
            style={listItemStyles.listItem}
          >
            <Horizontal spacing="sm" style={{ alignItems: "center", flex: 1 }}>
              {idsInAppGroup.includes(c.id) ? (
                <View style={{ opacity: 0.7 }}>
                  <DirectusIcon
                    name="check"
                    size={18}
                    color={theme.colors.success}
                  />
                </View>
              ) : (
                <View style={{ opacity: 0.25 }}>
                  <DirectusIcon
                    name="close"
                    size={18}
                    color={theme.colors.error}
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontWeight: "700" }}>
                  {APP_WIDGET_TYPES.find((t) => t.value === c.type)?.label}:{" "}
                  {c.title || c.collection}
                </Text>
              </View>
            </Horizontal>

            <Horizontal spacing="xs" style={{ marginLeft: "auto" }}>
              {!idsInAppGroup.includes(c.id) && (
                <Button
                  variant="ghost"
                  size="sm"
                  loading={syncingToWidgetId === c.id}
                  onPress={async () => {
                    setSyncingToWidgetId(c.id);
                    try {
                      const refreshed = await widgetItemsQuery.refetch();
                      await writeLatestItemsWidgetConfigListToCache(
                        (refreshed.data as any)?.configs ?? [],
                      );
                      const readBack = await getConfigListFromAppGroup();
                      if (readBack?.ids) setIdsInAppGroup(readBack.ids);
                    } finally {
                      setSyncingToWidgetId(null);
                    }
                  }}
                  disabled={syncingToWidgetId !== null}
                >
                  <DirectusIcon name="refresh" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onPress={() => openEdit(c)}>
                <DirectusIcon name="edit_square" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                colorScheme="error"
                onPress={() => remove(c)}
              >
                <DirectusIcon name="delete" />
              </Button>
            </Horizontal>
          </Pressable>
        ))}
      </Vertical>
      <Button
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
    </Vertical>
  );
}
