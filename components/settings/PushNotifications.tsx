import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filter, orderBy } from "lodash";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/display/button";
import { Text, Muted } from "@/components/display/typography";
import { Vertical } from "@/components/layout/Stack";
import { DividerSubtitle } from "@/components/display/subtitle";
import { usePushToken } from "@/hooks/usePushToken";
import {
  usePushCollectionExists,
  type PushSetupState,
} from "@/state/push/usePushCollection";
import { useInstallPushSchema } from "@/state/push/installPushSchema";
import { usePushDevice, useUpsertPushDevice } from "@/state/push/usePushDevice";
import { useCollections } from "@/state/queries/directus/core";
import { getCollectionTranslation } from "@/helpers/collections/getCollectionTranslation";
import type { PushSubscriptionEntry } from "@/constants/push";
import { Toggle } from "@/components/interfaces/toggle";
import Toast from "react-native-toast-message";
import { ActivityIndicator, Linking } from "react-native";
import { DirectusIcon } from "@/components/display/directus-icon";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import { Input } from "@/components/interfaces/input";

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
  const { token, loading: requestingPermission, requestToken } = usePushToken();
  const {
    data: setup,
    isLoading: loadingExists,
    isError: setupError,
  } = usePushCollectionExists();
  const installMutation = useInstallPushSchema();
  const { data: device, isLoading: loadingDevice } = usePushDevice(token);
  const upsertMutation = useUpsertPushDevice();
  const { data: collections } = useCollections();
  const sheetRef = useRef<BottomSheetModal | null>(null);
  const [installStaticApiKey, setInstallStaticApiKey] = useState("");

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
    if (!token) return;
    try {
      await upsertMutation.mutateAsync({ token, subscriptions });
      Toast.show({ type: "success", text1: t("push.saved") });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: t("push.saveError"),
        text2: (e as Error).message,
      });
    }
  };

  const handlePresentSheet = useCallback(() => {
    sheetRef.current?.present();
  }, []);

  // While we don't know yet if the schema exists, just show a basic loading state
  if (loadingExists) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle
          title={t("push.title")}
          icon="msNotifications"
        />
        <ActivityIndicator />
      </Vertical>
    );
  }

  // If setup query itself failed, show a simple message rather than breaking the screen.
  if (setupError && !setup) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title={t("push.title")} icon="msNotifications" />
        <Text>
          {t(
            "push.setupError",
            "Push notification settings are currently unavailable. Please try again later."
          )}
        </Text>
      </Vertical>
    );
  }

  const haveSchema =
    setup?.collectionExists && setup?.flowExists;

  // 1) Schema not installed yet → static API key input + Install button
  if (!haveSchema) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title={t("push.title")} icon="msNotifications" />
        <>
          <Muted>{t("push.installHint")}</Muted>
          <Input
            label={t("push.staticApiKeyLabel")}
            placeholder={t("push.staticApiKeyPlaceholder")}
            helper={t("push.staticApiKeyHelper")}
            value={installStaticApiKey}
            onChangeText={setInstallStaticApiKey}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            onPress={() =>
              installMutation.mutate({ staticApiKey: installStaticApiKey.trim() })
            }
            disabled={
              installMutation.isPending || !installStaticApiKey.trim()
            }
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
      </Vertical>
    );
  }

  // 2) Schema installed, but this role cannot access app_push_devices → show a warning.
  if (setup?.deviceAccess === "forbidden") {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title={t("push.title")} icon="msNotifications" />
        <Text style={{ color: "red" }}>
          {t(
            "push.permissionWarning",
            "Your role does not have permission to manage push notification settings. Please contact an administrator of this Directus instance to grant read/update/delete access on the app_push_devices collection."
          )}
        </Text>
      </Vertical>
    );
  }

  // 3) Schema installed, but notifications not enabled yet → offer Enable button
  if (!token) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title={t("push.title")} icon="msNotifications" />
        <Muted>{t("push.unavailable")}</Muted>
        <Button
          onPress={async () => {
            const newToken = await requestToken();
            if (!newToken) {
              Toast.show({
                type: "info",
                text1: t("push.permissionDeniedTitle", "Notifications disabled"),
                text2: t(
                  "push.permissionDeniedBody",
                  "Enable notifications for this app in the system settings to receive push notifications."
                ),
              });
              // Try to open the app's system settings so the user can enable notifications.
              try {
                await Linking.openSettings();
              } catch {
                // Ignore if not supported on this platform.
              }
              return;
            }

            // We successfully obtained a token; ensure a device record exists.
            try {
              const initialSubscriptions = mergeSubscriptions(
                userCollections,
                null
              );
              await upsertMutation.mutateAsync({
                token: newToken,
                subscriptions: initialSubscriptions,
              });
            } catch (e) {
              Toast.show({
                type: "error",
                text1: t(
                  "push.saveError",
                  "Could not save your push notification settings."
                ),
                text2: (e as Error).message,
              });
            }
          }}
          disabled={requestingPermission || upsertMutation.isPending}
        >
          {requestingPermission
            ? t("common.saving")
            : t("push.enableNotifications", "Enable notifications")}
        </Button>
      </Vertical>
    );
  }

  // 4) Schema installed and token present → show Manage button + bottom sheet
  return (
    <Vertical spacing="md">
      <DividerSubtitle title={t("push.title")} icon="msNotifications" />
      <Muted>{t("push.subscriptionsHint")}</Muted>

      <Button onPress={handlePresentSheet} disabled={loadingDevice}>
        {loadingDevice
          ? t("common.loading")
          : t("push.manageSubscriptions", "Manage subscriptions")}
      </Button>

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={["50%", "80%"]}
        enablePanDownToClose
      >
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ marginBottom: 8 }}>
            {t("push.subscriptionsHint")}
          </Text>
          {loadingDevice ? (
            <ActivityIndicator />
          ) : (
            <>
              {userCollections.map((col) => {
                const entry = subscriptions.find(
                  (s) => s.collection === col.collection
                );
                if (!entry) return null;
                const name = getCollectionTranslation(col, i18n.language);
                return (
                  <View
                    key={col.collection}
                    style={{ marginVertical: 8 }}
                  >
                    <Text style={{ marginBottom: 4 }}>{name}</Text>
                    <Vertical spacing="xs">
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ flex: 1 }}>
                          {t("push.onCreate")}
                        </Text>
                        <Toggle
                          value={entry.create}
                          onValueChange={(v) =>
                            updateEntry(col.collection, "create", v)
                          }
                        />
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ flex: 1 }}>
                          {t("push.onUpdate")}
                        </Text>
                        <Toggle
                          value={entry.update}
                          onValueChange={(v) =>
                            updateEntry(col.collection, "update", v)
                          }
                        />
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ flex: 1 }}>
                          {t("push.onDelete")}
                        </Text>
                        <Toggle
                          value={entry.delete}
                          onValueChange={(v) =>
                            updateEntry(col.collection, "delete", v)
                          }
                        />
                      </View>
                    </Vertical>
                  </View>
                );
              })}
              <Button
                onPress={async () => {
                  await handleSave();
                  sheetRef.current?.dismiss();
                }}
                disabled={upsertMutation.isPending}
                style={{ marginTop: 8 }}
              >
                {upsertMutation.isPending
                  ? t("common.saving")
                  : t("common.save")}
              </Button>
            </>
          )}
        </View>
      </BottomSheetModal>
    </Vertical>
  );
}
