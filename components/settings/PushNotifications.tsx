import { useEffect, useMemo, useRef, useState } from "react";
import { filter, orderBy } from "lodash";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/display/button";
import { Text, Muted } from "@/components/display/typography";
import { Horizontal, Vertical } from "@/components/layout/Stack";
import { Alert } from "@/components/display/alert";
import { DividerSubtitle } from "@/components/display/subtitle";
import { useAuth } from "@/contexts/AuthContext";
import { usePushToken } from "@/hooks/usePushToken";
import {
  usePushCollectionExists,
  usePushAccessOnly,
  isForbiddenError,
} from "@/state/push/usePushCollection";
import { useInstallPushSchema } from "@/state/push/installPushSchema";
import { usePushDevice, useUpsertPushDevice } from "@/state/push/usePushDevice";
import { useCollections, useRoles } from "@/state/queries/directus/core";
import { getCollectionTranslation } from "@/helpers/collections/getCollectionTranslation";
import type { PushSubscriptionEntry } from "@/constants/push";
import { Toggle } from "@/components/interfaces/toggle";
import Toast from "react-native-toast-message";
import { ActivityIndicator, Linking } from "react-native";
import { DirectusIcon } from "@/components/display/directus-icon";
import { Modal } from "@/components/display/modal";
import { Input } from "@/components/interfaces/input";
import { SelectMulti } from "@/components/interfaces/select-multi";
import { ScrollView } from "react-native-gesture-handler";
import { CheckboxGroup } from "../interfaces/checkbox-group";
import { ButtonGroup } from "../interfaces/button-group";
import { KeyboardAwareScrollView } from "../layout/Layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";

function defaultSubscription(collection: string): PushSubscriptionEntry {
  return { collection, create: false, update: false, delete: false };
}

function mergeSubscriptions(
  collections: Array<{ collection: string }>,
  current: PushSubscriptionEntry[] | null,
): PushSubscriptionEntry[] {
  const byCollection = new Map<string, PushSubscriptionEntry>();
  (current ?? []).forEach((s) => byCollection.set(s.collection, s));
  return collections.map((c) => {
    const existing = byCollection.get(c.collection);
    return existing ?? defaultSubscription(c.collection);
  });
}

export function PushNotifications() {
  const { theme } = useStyles();
  const { t, i18n } = useTranslation();
  const { bottom, top } = useSafeAreaInsets();
  const { policyGlobals } = useAuth();
  const { token, loading: requestingPermission, requestToken } = usePushToken();
  const runFullSetupCheck = policyGlobals?.admin_access === true;
  const {
    data: setup,
    isLoading: loadingExists,
    isError: setupError,
    refetch: refetchSetup,
  } = usePushCollectionExists(runFullSetupCheck);
  const {
    data: accessOnly,
    isLoading: loadingAccessOnly,
    refetch: refetchAccessOnly,
  } = usePushAccessOnly(!runFullSetupCheck);
  const deviceAccess = runFullSetupCheck
    ? setup?.deviceAccess
    : accessOnly?.deviceAccess;
  const installMutation = useInstallPushSchema();
  const {
    data: device,
    isLoading: loadingDevice,
    isError: deviceError,
    error: deviceErrorPayload,
    refetch: refetchDevice,
  } = usePushDevice(token);
  const upsertMutation = useUpsertPushDevice();
  const { data: collections } = useCollections();
  const [search, setSearch] = useState("");
  const [installStaticApiKey, setInstallStaticApiKey] = useState("");
  const [installRoleIds, setInstallRoleIds] = useState<string[]>([]);
  const { data: rolesData } = useRoles();
  const roles = Array.isArray(rolesData?.items) ? rolesData.items : [];
  const roleOptions = roles
    .map((r: { id?: string; name?: string }) => ({
      text: r.name ?? String(r.id ?? ""),
      value: r.id ?? "",
    }))
    .filter((o) => o.value);

  const userCollections = useMemo(() => {
    if (!collections) return [];
    return orderBy(
      filter(
        collections,
        (c) =>
          !c.collection.startsWith("directus_") &&
          !!c.meta &&
          !c.meta?.hidden &&
          !!c.schema,
      ),
      (i) => i.meta?.sort,
    );
  }, [collections]);

  const merged = useMemo(
    () => mergeSubscriptions(userCollections, device?.subscriptions ?? null),
    [userCollections, device?.subscriptions],
  );
  const [subscriptions, setSubscriptions] =
    useState<PushSubscriptionEntry[]>(merged);
  const lastSavedJsonRef = useRef<string>("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createDeviceAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (merged.length > 0) setSubscriptions(merged);
  }, [device?.id, userCollections.length]);

  // When we have a token but no device record yet, create it in the background so Manage works straight away.
  useEffect(() => {
    if (
      !token ||
      device != null ||
      loadingDevice ||
      deviceError ||
      deviceAccess !== "ok"
    )
      return;
    if (createDeviceAttemptedRef.current === token) return;
    createDeviceAttemptedRef.current = token;
    const initial = mergeSubscriptions(userCollections, null);
    upsertMutation.mutateAsync({ token, subscriptions: initial }).catch(() => {
      createDeviceAttemptedRef.current = null;
    });
  }, [
    token,
    device,
    loadingDevice,
    deviceError,
    deviceAccess,
    userCollections,
    upsertMutation,
  ]);

  const updateEntry = (
    collection: string,
    key: "create" | "update" | "delete",
    value: boolean,
  ) => {
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.collection === collection ? { ...s, [key]: value } : s,
      ),
    );
  };

  // Auto-save subscriptions on every change (debounced).
  useEffect(() => {
    if (!token) return;
    if (deviceAccess !== "ok") return;

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
  }, [subscriptions, token, deviceAccess, upsertMutation, t]);

  const loading =
    (runFullSetupCheck && loadingExists) ||
    (!runFullSetupCheck && loadingAccessOnly);

  // While we don't know yet (admin: schema/flow; non-admin: device access), show loading
  if (loading) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title={t("push.title")} icon="msNotifications" />
        <ActivityIndicator />
      </Vertical>
    );
  }

  // If full setup check ran and failed (admin path only), show error.
  if (runFullSetupCheck && setupError && !setup) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title={t("push.title")} icon="msNotifications" />
        <Text>
          {t(
            "push.setupError",
            "Push notification settings are currently unavailable. Please try again later.",
          )}
        </Text>
      </Vertical>
    );
  }

  const haveSchema = setup?.collectionExists && setup?.flowExists;

  // 1) Admin only: schema not installed yet → static API key + role select + Install button
  if (runFullSetupCheck && !haveSchema) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title={t("push.title")} icon="msNotifications" />
        <>
          {(setup?.issues?.includes("missing_collection") ||
            setup?.issues?.includes("missing_flow")) && (
            <Alert
              status="warning"
              message={
                setup?.issues?.includes("missing_collection") &&
                setup?.issues?.includes("missing_flow")
                  ? t(
                      "push.installHint",
                      "This instance is not set up for push yet. An admin can install the required schema and flow.",
                    )
                  : setup?.issues?.includes("missing_collection")
                    ? t(
                        "push.missingCollectionHint",
                        "The push collection is missing. An admin can install it.",
                      )
                    : t(
                        "push.missingFlowHint",
                        "The push flow is missing. An admin can install it.",
                      )
              }
            ></Alert>
          )}
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
              installMutation.mutate({
                staticApiKey: installStaticApiKey.trim(),
              })
            }
            disabled={installMutation.isPending || !installStaticApiKey.trim()}
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
        "Could not verify push permissions",
      ),
      text2: t(
        "push.permissionCheckFailedBody",
        "We couldn't verify whether your role can access push settings. If enabling push fails, contact an administrator.",
      ),
    });
  }

  // 2) No access to app_push_devices (probe 403) or device fetch failed (e.g. 403) → show warning.
  // Don't treat device fetch error as forbidden for admins (avoids brief flash during reinstall/refresh).
  const deviceForbidden =
    deviceAccess === "forbidden" ||
    (!!token && deviceError && !policyGlobals?.admin_access);
  if (deviceForbidden) {
    return (
      <Vertical spacing="md">
        <DividerSubtitle title={t("push.title")} icon="msNotifications" />
        <Alert
          status="danger"
          message={t(
            "push.permissionWarning",
            "You don't have permission to manage push settings. Ask an admin to grant access to app_push_devices.",
          )}
        />
        <Button
          onPress={() => {
            refetchSetup();
            refetchAccessOnly();
            refetchDevice();
          }}
          variant="soft"
          style={{ marginTop: 8 }}
        >
          {t("push.checkAgain", "Check again")}
        </Button>
      </Vertical>
    );
  }

  // 3) No token → Enable notifications (request token, then create row on success)
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
                text1: t(
                  "push.permissionDeniedTitle",
                  "Notifications disabled",
                ),
                text2: t(
                  "push.permissionDeniedBody",
                  "Enable notifications for this app in the system settings to receive push notifications.",
                ),
              });
              try {
                await Linking.openSettings();
              } catch {
                // Ignore if not supported on this platform.
              }
              return;
            }
            try {
              const initialSubscriptions = mergeSubscriptions(
                userCollections,
                null,
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
                  "Could not save your push notification settings.",
                ),
                text2: (e as Error).message,
              });
            }
          }}
          disabled={requestingPermission || upsertMutation.isPending}
        >
          {requestingPermission || upsertMutation.isPending
            ? t("common.saving")
            : t("push.enableNotifications", "Enable notifications")}
        </Button>
      </Vertical>
    );
  }

  // 4) Token present → show Manage (device row is created in background if missing)
  const creatingDevice =
    device == null && !loadingDevice && !deviceError && deviceAccess === "ok";
  return (
    <Modal>
      <Vertical spacing="md">
        <DividerSubtitle title={t("push.title")} icon="msNotifications" />
        <Muted>{t("push.subscriptionsHint")}</Muted>

        <Modal.Trigger>
          {({ open }) => (
            <Button
              onPress={open}
              disabled={
                loadingDevice || (creatingDevice && upsertMutation.isPending)
              }
            >
              {loadingDevice || (creatingDevice && upsertMutation.isPending)
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
              {loadingDevice || (creatingDevice && upsertMutation.isPending) ? (
                <ActivityIndicator />
              ) : (
                <KeyboardAwareScrollView stickyHeaderIndices={[1]}>
                  <Muted style={{ marginBottom: 8 }}>
                    {t("push.subscriptionsHint")}
                  </Muted>
                  <View style={{ paddingBottom: 8, backgroundColor: theme.colors.background }}>
                    <Input
                      label={t("push.searchLabel")}
                      placeholder={t("push.searchPlaceholder")}
                      value={search}
                      onChangeText={setSearch}
                      append={<DirectusIcon name="search" />}
                    />
                  </View>
                  {userCollections
                    .filter((col) => {
                      const name = getCollectionTranslation(col, i18n.language);
                      return (
                        name
                          ?.replace("_", " ")
                          .toLowerCase()
                          .includes(search.toLowerCase()) ?? false
                      );
                    })
                    .sort((a, b) => a.collection.localeCompare(b.collection))
                    .map((col) => {
                      const entry = subscriptions.find(
                        (s) => s.collection === col.collection,
                      );
                      if (!entry) return null;
                      const name = getCollectionTranslation(col, i18n.language);
                      return (
                        <Horizontal
                          key={col.collection}
                          spacing="md"
                          style={{ marginVertical: 4 }}
                        >
                          <Text
                            style={{ marginBottom: 4, flex: 1 }}
                            numberOfLines={1}
                          >
                            {name}
                          </Text>
                          <View style={{ flex: 1 }}>
                            <ButtonGroup
                              options={[
                                {
                                  value: "create",
                                  icon: <DirectusIcon name="add_circle" />,
                                },
                                {
                                  value: "update",
                                  icon: <DirectusIcon name="update" />,
                                },
                                {
                                  value: "delete",
                                  icon: <DirectusIcon name="delete" />,
                                },
                              ]}
                              value={
                                [
                                  entry.create ? "create" : undefined,
                                  entry.update ? "update" : undefined,
                                  entry.delete ? "delete" : undefined,
                                ].filter(Boolean) as (string | number)[]
                              }
                              onChange={(value) => {
                                ["create", "update", "delete"].forEach((v) => {
                                  const isSelected = value.includes(v);
                                  updateEntry(
                                    col.collection,
                                    v as "create" | "update" | "delete",
                                    isSelected,
                                  );
                                });
                              }}
                            />
                          </View>
                        </Horizontal>
                      );
                    })}
                  
                </KeyboardAwareScrollView>
              )}
            </View>
          )}
        </Modal.Content>
      </Vertical>
    </Modal>
  );
}
