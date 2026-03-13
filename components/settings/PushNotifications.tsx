import { useEffect, useMemo, useState } from "react";
import { filter, orderBy } from "lodash";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/display/button";
import { Text, Muted } from "@/components/display/typography";
import { Vertical } from "@/components/layout/Stack";
import { DividerSubtitle } from "@/components/display/subtitle";
import { usePushToken } from "@/hooks/usePushToken";
import { usePushCollectionExists } from "@/state/push/usePushCollection";
import { useInstallPushSchema } from "@/state/push/installPushSchema";
import { usePushDevice, useUpsertPushDevice } from "@/state/push/usePushDevice";
import { useCollections } from "@/state/queries/directus/core";
import { getCollectionTranslation } from "@/helpers/collections/getCollectionTranslation";
import type { PushSubscriptionEntry } from "@/constants/push";
import { Toggle } from "@/components/interfaces/toggle";
import Toast from "react-native-toast-message";
import { ActivityIndicator } from "react-native";
import { DirectusIcon } from "@/components/display/directus-icon";

function defaultSubscription(collection: string): PushSubscriptionEntry {
  return { collection, create: false, update: false, delete: false };
}

function mergeSubscriptions(
  collections: Array<{ collection: string }>,
  current: PushSubscriptionEntry[] | null
): PushSubscriptionEntry[] {
  const byCollection = new Map<string, PushSubscriptionEntry>();
  (current ?? []).forEach((s) => byCollection.set(s.collection, s));
  return collections.map((c) => {
    const existing = byCollection.get(c.collection);
    return existing ?? defaultSubscription(c.collection);
  });
}

export function PushNotifications() {
  const { t, i18n } = useTranslation();
  const pushToken = usePushToken();
  const { data: collectionExists, isLoading: loadingExists } =
    usePushCollectionExists();
  const installMutation = useInstallPushSchema();
  const { data: device, isLoading: loadingDevice } = usePushDevice(pushToken);
  const upsertMutation = useUpsertPushDevice();
  const { data: collections } = useCollections();

  const userCollections = useMemo(() => {
    if (!collections) return [];
    return orderBy(
      filter(
        collections,
        (c) =>
          !c.collection.startsWith("directus_") &&
          !!c.meta &&
          !c.meta?.hidden &&
          !!c.schema
      ),
      (i) => i.meta?.sort
    );
  }, [collections]);

  const merged = useMemo(
    () => mergeSubscriptions(userCollections, device?.subscriptions ?? null),
    [userCollections, device?.subscriptions]
  );
  const [subscriptions, setSubscriptions] =
    useState<PushSubscriptionEntry[]>(merged);

  useEffect(() => {
    if (merged.length > 0) setSubscriptions(merged);
  }, [device?.id, userCollections.length]);

  const updateEntry = (
    collection: string,
    key: "create" | "update" | "delete",
    value: boolean
  ) => {
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.collection === collection ? { ...s, [key]: value } : s
      )
    );
  };

  const handleSave = async () => {
    if (!pushToken) return;
    try {
      await upsertMutation.mutateAsync({ token: pushToken, subscriptions });
      Toast.show({ type: "success", text1: t("push.saved") });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: t("push.saveError"),
        text2: (e as Error).message,
      });
    }
  };

  if (pushToken === null && !loadingExists) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle
          title={t("push.title")}
          icon="msNotifications"
        />
        <Muted>{t("push.unavailable")}</Muted>
      </Vertical>
    );
  }

  if (loadingExists || collectionExists === false) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title={t("push.title")} icon="msNotifications" />
        {!collectionExists && !loadingExists && (
          <>
            <Muted>{t("push.installHint")}</Muted>
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
                ? t("push.installing")
                : t("push.installSchema")}
            </Button>
            {installMutation.isError && (
              <Text style={{ color: "red" }}>
                {(installMutation.error as Error).message}
              </Text>
            )}
          </>
        )}
      </Vertical>
    );
  }

  if (collectionExists && (!pushToken || loadingDevice)) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title={t("push.title")} icon="msNotifications" />
        {pushToken ? (
          <ActivityIndicator />
        ) : (
          <Muted>{t("push.unavailable")}</Muted>
        )}
      </Vertical>
    );
  }

  return (
    <Vertical spacing="md">
      <DividerSubtitle title={t("push.title")} icon="msNotifications" />
      <Muted>{t("push.subscriptionsHint")}</Muted>
      {userCollections.map((col) => {
        const entry = subscriptions.find((s) => s.collection === col.collection);
        if (!entry) return null;
        const name = getCollectionTranslation(col, i18n.language);
        return (
          <View key={col.collection} style={{ marginVertical: 8 }}>
            <Text style={{ marginBottom: 4 }}>{name}</Text>
            <Vertical spacing="xs">
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ flex: 1 }}>{t("push.onCreate")}</Text>
                <Toggle
                  value={entry.create}
                  onValueChange={(v) => updateEntry(col.collection, "create", v)}
                />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ flex: 1 }}>{t("push.onUpdate")}</Text>
                <Toggle
                  value={entry.update}
                  onValueChange={(v) => updateEntry(col.collection, "update", v)}
                />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ flex: 1 }}>{t("push.onDelete")}</Text>
                <Toggle
                  value={entry.delete}
                  onValueChange={(v) => updateEntry(col.collection, "delete", v)}
                />
              </View>
            </Vertical>
          </View>
        );
      })}
      <Button
        onPress={handleSave}
        disabled={upsertMutation.isPending}
      >
        {upsertMutation.isPending ? t("common.saving") : t("common.save")}
      </Button>
    </Vertical>
  );
}
