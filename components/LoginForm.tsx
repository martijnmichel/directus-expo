import React, { useEffect, useMemo } from "react";
import { View, Alert, Pressable } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "./interfaces/input";
import { Button } from "./display/button";
import { useStyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { APISelect } from "./APISelect";
import {
  mutateLocalStorage,
  useLocalStorage,
} from "@/state/local/useLocalStorage";
import { LocalStorageKeys } from "@/state/local/useLocalStorage";
import { formStyles } from "./interfaces/style";
import { Vertical } from "./layout/Stack";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select } from "./interfaces/select";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { API } from "./APIForm";
import { readSessionWrapper } from "@/state/auth/directusSessionStorage";
import { useResolvedActiveSession } from "@/hooks/useResolvedActiveSession";
import { resolveActiveSessionContext } from "@/state/auth/resolveActiveSession";
import * as WebBrowser from "expo-web-browser";
import { InstanceSessionSelect } from "./InstanceSessionSelect";
import { X } from "./icons/X";

WebBrowser.maybeCompleteAuthSession();

function hasDirectusHost(url: string): boolean {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return u.hostname.length > 0;
  } catch {
    return false;
  }
}

const apiSchema = z.object({
  id: z.string().min(1, "Select or add a saved instance"),
  sessionId: z.string().optional(),
  url: z.string().url(),
  name: z.string(),
  sessionIds: z.array(z.string()).optional(),
});

const loginSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("email"),
    email: z.string().email(),
    password: z.string().min(1),
    api: apiSchema,
  }),
  z.object({
    type: z.literal("apiKey"),
    apiKey: z.string().min(1),
    api: apiSchema,
  }),
]);

export type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const { styles, theme } = useStyles(formStyles);
  const { t } = useTranslation();
  const { login, setApiKey, refreshSession } = useAuth();
  const { data: apisList } = useLocalStorage<API[]>(
    LocalStorageKeys.DIRECTUS_APIS,
    undefined,
    [],
  );
  const { data: activeSessionId = "" } = useLocalStorage<string>(
    LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID,
    undefined,
    "",
  );
  const resolved = useResolvedActiveSession();
  /** Saved session can be resumed without re-entering credentials */
  const [refreshState, setRefreshState] = useState<
    "unknown" | "available" | "unavailable"
  >("unknown");
  const [apiKeyEditUnlocked, setApiKeyEditUnlocked] = useState(false);
  const [emailReloginUnlocked, setEmailReloginUnlocked] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    setError,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      type: "email",
      api: {
        id: "",
        name: "",
        url: "",
        sessionIds: [],
      },
    },
  });

  const url = watch("api.url");
  const instanceIdW = watch("api.id");
  const sessionIdW = watch("api.sessionId");
  const typeW = watch("type");
  const emailW = watch("email");
  const passwordW = watch("password");
  const apiKeyW = watch("apiKey");
  const apiW = watch("api");
  const selectedApi = (apisList ?? []).find((a) => a.id === instanceIdW);

  const loginBaseUrl = useMemo(() => {
    const u = (url ?? "").trim();
    if (u && hasDirectusHost(u)) return u;
    return (selectedApi?.url ?? "").trim();
  }, [url, selectedApi?.url]);

  const isExistingSession = !!sessionIdW?.trim();
  const isSavedApiKeySession = isExistingSession && typeW === "apiKey";
  const isSavedEmailSession = isExistingSession && typeW === "email";
  const refreshAvailable = refreshState === "available";
  const shouldShowEmailInputs = !isSavedEmailSession || emailReloginUnlocked;
  const canSubmitLogin =
    (!isSavedApiKeySession || apiKeyEditUnlocked) &&
    (!isSavedEmailSession || emailReloginUnlocked);

  const hasApiSelected = !!instanceIdW?.trim();
  const credentialsComplete =
    typeW === "email"
      ? !!emailW?.trim() && !!passwordW?.trim()
      : !!apiKeyW?.trim();
  const loginSubmitDisabled =
    !hasApiSelected ||
    !loginBaseUrl ||
    !credentialsComplete;

  useEffect(() => {
    if (!instanceIdW?.trim() || !hasDirectusHost(url ?? "")) {
      clearErrors("api");
      return;
    }
    clearErrors("api");
    const base = url.replace(/\/$/, "");
    fetch(`${base}/server/health`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status !== "ok") {
          setError("api", { message: t("form.errors.apiNotHealthy") });
        }
      })
      .catch(() => {
        setError("api", { message: t("form.errors.apiNotHealthy") });
      });
  }, [url, instanceIdW, clearErrors, setError, t]);

  useEffect(() => {
    const sid = String(activeSessionId ?? "").trim();
    if (!sid) return;
    let cancelled = false;

    const applySessionToForm = (ctx: {
      sessionId: string;
      api: API;
      wrapper: { apiId: string; authType: "email" | "apiKey" };
    }) => {
      setValue("api", {
        ...ctx.api,
        id: ctx.api.id ?? ctx.wrapper.apiId,
        sessionId: ctx.sessionId,
      });
      setValue("type", ctx.wrapper.authType);
    };

    const fromQuery = resolved.data;
    if (fromQuery && fromQuery.sessionId === sid) {
      applySessionToForm(fromQuery);
      return;
    }

    // Fallback for hard refresh/direct navigation where query hydration may lag.
    (async () => {
      const ctx = await resolveActiveSessionContext();
      if (cancelled || !ctx || ctx.sessionId !== sid) return;
      applySessionToForm(ctx);
    })();

    return () => {
      cancelled = true;
    };
  }, [resolved.data, activeSessionId, setValue]);

  useEffect(() => {
    const sid = sessionIdW?.trim();
    if (!sid) {
      // Must NOT be "unavailable" here: on F5, session id hydrates one frame later; a stale
      // "unavailable" in the same flush as a new sessionId would wrongly unlock email relogin.
      setRefreshState("unknown");
      return;
    }
    setRefreshState("unknown");
    let cancelled = false;
    (async () => {
      try {
        const w = await readSessionWrapper(sid);
        if (cancelled) return;
        const authType = w?.authType ?? "email";
        setValue("type", authType);
        /** Email: only when a refresh token exists (SDK refresh), same as before. */
        const emailRefresh =
          (w?.authType === "email" || !w?.authType) &&
          !!w?.sdk?.refresh_token;
        /** API key: always show Refresh — re-applies stored static token. */
        const apiKeyRelog = w?.authType === "apiKey";
        setRefreshState(emailRefresh || apiKeyRelog ? "available" : "unavailable");
      } catch {
        if (!cancelled) {
          setRefreshState("unavailable");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionIdW, setValue]);

  useEffect(() => {
    // New session selection starts locked again for saved API key accounts.
    setApiKeyEditUnlocked(false);
    setEmailReloginUnlocked(false);
  }, [sessionIdW, typeW]);

  useEffect(() => {
    // Saved email session with no refresh path should fall back to manual login.
    if (isSavedEmailSession && refreshState === "unavailable") {
      setEmailReloginUnlocked(true);
    }
  }, [isSavedEmailSession, refreshState]);

  useEffect(() => {
    if (refreshState === "available" && isSavedEmailSession) {
      setEmailReloginUnlocked(false);
    }
  }, [refreshState, isSavedEmailSession]);

  const mutateActiveSessionId = mutateLocalStorage(
    LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID,
  );
  const mutateApis = mutateLocalStorage(LocalStorageKeys.DIRECTUS_APIS);

  const persistNewSession = (apiRow: z.infer<typeof apiSchema>, sid: string) => {
    const next = (apisList ?? []).map((a) =>
      a.id === apiRow.id
        ? {
            ...a,
            sessionIds: [...new Set([...(a.sessionIds ?? []), sid])],
          }
        : a,
    );
    mutateApis.mutate(next);
  };

  const onSubmit = async (data: LoginFormData) => {
    const sessionId = data.api.sessionId ?? uuidv4();
    const isNewSession = !data.api.sessionId;

    if (data.type === "email") {
      try {
        await login(
          data.email,
          data.password,
          data.api.url,
          sessionId,
          data.api.id,
        );
        if (isNewSession) {
          persistNewSession(data.api, sessionId);
        }
        mutateActiveSessionId.mutate(sessionId);
        router.push("/");
      } catch {
        Alert.alert("Error", t("form.errors.loginFailed"));
      }
    } else if (data.type === "apiKey") {
      try {
        await setApiKey(
          data.apiKey,
          data.api.url,
          sessionId,
          data.api.id,
        );
        if (isNewSession) {
          persistNewSession(data.api, sessionId);
        }
        mutateActiveSessionId.mutate(sessionId);
        router.push("/");
      } catch {
        Alert.alert("Error", t("form.errors.loginFailed"));
      }
    }
  };

  return (
    <View style={{ ...styles.form, minWidth: 300 }}>
      <Controller
        control={control}
        rules={{
          required: t("form.errors.apiUrlRequired"),
        }}
        name="api"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <APISelect
            value={value}
            onChange={(api) =>
              onChange(
                api
                  ? {
                      ...api,
                      sessionId: undefined,
                    }
                  : undefined,
              )
            }
            error={error?.message}
          />
        )}
      />
      <InstanceSessionSelect
        api={selectedApi}
        sessionId={sessionIdW}
        onSessionChange={(nextSessionId) => {
          setValue("api", {
            ...(apiW ?? {}),
            id: instanceIdW ?? "",
            name: apiW?.name ?? selectedApi?.name ?? "",
            url: apiW?.url ?? selectedApi?.url ?? "",
            sessionIds: selectedApi?.sessionIds ?? apiW?.sessionIds ?? [],
            sessionId: nextSessionId,
          });
        }}
      />

      <Controller
        control={control}
        rules={{
          required: t("form.errors.loginTypeRequired"),
        }}
        name="type"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <Select
            options={[
              { value: "email", text: t("form.loginTypeEmail") },
              { value: "apiKey", text: t("form.loginTypeApiKey") },
            ]}
            label={t("form.loginType")}
            value={value}
            onValueChange={(v) => onChange(v as "email" | "apiKey")}
            error={error?.message}
            disabled={isExistingSession}
           
          />
        )}
      />

      {typeW === "apiKey" && (
        <Controller
          control={control}
          rules={{ required: t("form.errors.apiKeyRequired") }}
          name="apiKey"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              onChangeText={onChange}
              value={value}
              placeholder={t("form.apiKeyPlaceholder")}
              label={t("form.apiKey")}
              error={error?.message}
              disabled={isSavedApiKeySession && !apiKeyEditUnlocked}
              
              append={
                isSavedApiKeySession && !apiKeyEditUnlocked ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("form.unlockApiKeyInput")}
                    hitSlop={12}
                    onPress={() => {
                      setApiKeyEditUnlocked(true);
                      setValue("apiKey", "");
                      clearErrors("apiKey");
                    }}
                  >
                    <X size={20} color={theme.colors.textSecondary} />
                  </Pressable>
                ) : undefined
              }
            />
          )}
        />
      )}

      {typeW === "email" && shouldShowEmailInputs && (
        <>
          <Controller
            control={control}
            rules={{ required: t("form.errors.emailRequired") }}
            name="email"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Input
                onChangeText={onChange}
                value={value}
                placeholder={t("form.email")}
                label={t("form.email")}
                error={error?.message}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            )}
          />
          <Controller
            control={control}
            rules={{ required: t("form.errors.passwordRequired") }}
            name="password"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Input
                onChangeText={onChange}
                value={value}
                placeholder={t("form.password")}
                label={t("form.password")}
                error={error?.message}
                autoComplete="password"
                secureTextEntry
              />
            )}
          />
        </>
      )}

      <Vertical>
        {canSubmitLogin && (
          <Button
            loading={isSubmitting}
            disabled={loginSubmitDisabled}
            onPress={handleSubmit(onSubmit)}
          >
            {t("form.login")}
          </Button>
        )}

        {isExistingSession && refreshAvailable && (
          <Button
            variant="soft"
            onPress={() => {
              const sid = sessionIdW?.trim();
              if (!sid || !loginBaseUrl) {
                Alert.alert(
                  t("common.error"),
                  t("form.errors.refreshMissingTarget"),
                );
                return;
              }
              refreshSession({ url: loginBaseUrl, sessionId: sid })
                .then((result) => {
                  if (result.ok) {
                    mutateActiveSessionId.mutate(sid);
                    router.push("/");
                  } else {
                    if (typeW === "email") {
                      setEmailReloginUnlocked(true);
                    }
                    Alert.alert(
                      t("form.refreshFailedTitle"),
                      t("form.refreshFailedBody"),
                    );
                  }
                })
                .catch(() => {
                  if (typeW === "email") {
                    setEmailReloginUnlocked(true);
                  }
                  Alert.alert(
                    t("common.error"),
                    t("form.refreshErrorGeneric"),
                  );
                });
            }}
          >
            {t("form.refreshSession")}
          </Button>
        )}
      </Vertical>
    </View>
  );
};
