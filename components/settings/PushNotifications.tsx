import { useEffect, useMemo, useRef, useState } from "react";
import { filter, orderBy } from "lodash";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/display/button";
import { Text, Muted } from "@/components/display/typography";
import { Horizontal, Vertical } from "@/components/layout/Stack";
import { DividerSubtitle } from "@/components/display/subtitle";
import { usePushToken } from "@/hooks/usePushToken";
import {
  usePushCollectionExists,
  type PushSetupState,
} from "@/state/push/usePushCollection";
import { useInstallPushSchema } from "@/state/push/installPushSchema";
import { usePushDevice, useUpsertPushDevice } from "@/state/push/usePushDevice";
import {
  useCollections,
  useRoles,
} from "@/state/queries/directus/core";
import { getCollectionTranslation } from "@/helpers/collections/getCollectionTranslation";
import type { PushSubscriptionEntry } from "@/constants/push";
import { Toggle } from "@/components/interfaces/toggle";
import Toast from "react-native-toast-message";
import { ActivityIndicator, Linking } from "react-native";
import { DirectusIcon } from "@/components/display/directus-icon";
import { Modal } from "@/components/display/modal";
import { Input } from "@/components/interfaces/input";
import { SelectMulti } from "@/components/interfaces/select-multi";
import { KeyboardAwareScrollView } from "../layout/Layout";
import { ScrollView } from "react-native-gesture-handler";

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
  const [installStaticApiKey, setInstallStaticApiKey] = useState("");
  const [installRoleIds, setInstallRoleIds] = useState<string[]>([]);
  const { data: rolesData } = useRoles();
  const roles = Array.isArray(rolesData?.items) ? rolesData.items : [];
  const roleOptions = roles.map((r: { id?: string; name?: string }) => ({
    text: r.name ?? String(r.id ?? ""),
    value: r.id ?? "",
  })).filter((o) => o.value);

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
  const lastSavedJsonRef = useRef<string>("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (merged.length > 0) setSubscriptions(merged);
  }, [device?.id, userCollections.length]);

  const updateEntry = (
    collection: string,
    key: "create" | "update" | "delete",
    value: boolean
  ) => {
    console.log("updateEntry", collection, key, value);
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.collection === collection ? { ...s, [key]: value } : s
      )
    );
  };

  // Auto-save subscriptions on every change (debounced).
  useEffect(() => {
    if (!token) return;
    if (setup?.deviceAccess !== "ok") return;

    const json = JSON.stringify(subscriptions ?? []);
    if (json === lastSavedJsonRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await upsertMutation.mutateAsync({ token, subscriptions });
        lastSavedJsonRef.current = json;
      } catch (e) {
        Toast.show({
          type: "error",
          text1: t("push.saveError"),
          text2: (e as Error).message,
        });
      }
    }, 600);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [subscriptions, token, setup?.deviceAccess, upsertMutation, t]);

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

  const haveSchema = setup?.collectionExists && setup?.flowExists;

  // 1) Schema not installed yet → static API key input + role select + Install button
  if (!haveSchema) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title={t("push.title")} icon="msNotifications" />
        <>
          <Muted>
            {setup?.issues?.includes("missing_collection") &&
            setup?.issues?.includes("missing_flow")
              ? t(
                  "push.installHint",
                  "This instance is not set up for push yet. An admin can install the required schema and flow."
                )
              : setup?.issues?.includes("missing_collection")
                ? t(
                    "push.missingCollectionHint",
                    "The push collection is missing. An admin can install it."
                  )
                : t(
                    "push.missingFlowHint",
                    "The push flow is missing. An admin can install it."
                  )}
          </Muted>
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
          <SelectMulti
            label={t("push.installRolesLabel", "Roles that can use push notifications")}
            helper={t(
              "push.installRolesHelper",
              "A new permission (read, create, update, delete on app_push_devices) will be added to the selected roles."
            )}
            options={roleOptions}
            value={installRoleIds}
            onValueChange={(v) => setInstallRoleIds((v as string[]) ?? [])}
            placeholder={t("push.installRolesPlaceholder", "Select roles")}
          />
          <Button
            onPress={() =>
              installMutation.mutate({
                staticApiKey: installStaticApiKey.trim(),
                roleIds: installRoleIds,
              })
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

  // Schema exists but we can't reliably determine device access (non-403 error) → show a warning but keep going.
  if (setup?.issues?.includes("unknown_device_access")) {
    Toast.show({
      type: "info",
      text1: t(
        "push.permissionCheckFailedTitle",
        "Could not verify push permissions"
      ),
      text2: t(
        "push.permissionCheckFailedBody",
        "We couldn't verify whether your role can access push settings. If enabling push fails, contact an administrator."
      ),
    });
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
    <Modal>
      <Vertical spacing="md">
        <DividerSubtitle title={t("push.title")} icon="msNotifications" />
        <Muted>{t("push.subscriptionsHint")}</Muted>

        <Modal.Trigger>
          {({ open }) => (
            <Button onPress={open} disabled={loadingDevice}>
              {loadingDevice
                ? t("common.loading")
                : t("push.manageSubscriptions", "Manage subscriptions")}
            </Button>
          )}
        </Modal.Trigger>

        <Modal.Content
          variant="bottomSheet"
          height="80%"
          title={t("push.title")}
        >
          {({ close }) => (
            <View>
              <Text style={{ marginBottom: 8 }}>
                {t("push.subscriptionsHint")}
              </Text>
              {loadingDevice ? (
                <ActivityIndicator />
              ) : (
                <ScrollView>
                  {userCollections.sort((a, b) => a.collection.localeCompare(b.collection)).map((col) => {
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
                        <Horizontal spacing="xs" style={{ justifyContent: "space-evenly" }}>
                          <Vertical spacing="xs"
                          >
                            <Text>
                              {t("push.onCreate")}
                            </Text>
                            <Toggle
                              value={entry.create}
                              onValueChange={(v) =>
                                updateEntry(col.collection, "create", v)
                              }
                            />
                          </Vertical>
                          <Vertical spacing="xs">
                            <Text>
                              {t("push.onUpdate")}
                            </Text>
                            <Toggle
                              value={entry.update}
                              onValueChange={(v) =>
                                updateEntry(col.collection, "update", v)
                              }
                            />
                            </Vertical>
                          <Vertical spacing="xs">
                            <Text>
                              {t("push.onDelete")}
                            </Text>
                            <Toggle
                              value={entry.delete}
                              onValueChange={(v) =>
                                updateEntry(col.collection, "delete", v)
                              }
                            />
                            </Vertical>
                        </Horizontal>
                      </View>
                    );
                  })}
                  <Button
                    onPress={async () => {
                      close();
                    }}
                    disabled={upsertMutation.isPending}
                    style={{ marginTop: 8 }}
                  >
                    {upsertMutation.isPending
                      ? t("common.saving")
                      : t("common.save")}
                  </Button>
                </ScrollView>
              )}
            </View>
          )}
        </Modal.Content>
      </Vertical>
    </Modal>
  );
}
