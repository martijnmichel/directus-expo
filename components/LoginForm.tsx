import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  Linking,
} from "react-native";
import { useForm, Controller, Form } from "react-hook-form";
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
import { API } from "./APIForm";
import { formStyles } from "./interfaces/style";
import { useProviders } from "@/state/queries/directus/core";
import { Vertical } from "./layout/Stack";
import { map } from "lodash";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { ReadProviderOutput } from "@directus/sdk";
import { useAuthRequest } from "expo-auth-session/build/providers/Google";
import { useAutoDiscovery } from "expo-auth-session";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select } from "./interfaces/select";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";

WebBrowser.maybeCompleteAuthSession();

// Discriminated union type for different login methods

const apiSchema = z.object({
  url: z.string().url(),
  name: z.string(),
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

const redirectUri = AuthSession.makeRedirectUri();

interface LoginForm {
  email: string;
  password: string;
  api: API;
}

export const LoginForm = () => {
  const { styles } = useStyles(formStyles);
  const { login, setApiKey, refreshSession } = useAuth();
  const { data: api } = useLocalStorage<API>(
    LocalStorageKeys.DIRECTUS_API_ACTIVE,
  );
  const [hasRefreshToken, setHasRefreshToken] = useState(false);

  const apiKey = process.env.EXPO_PUBLIC_DIRECTUS_API_KEY_DEMO;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      type: "email",
      api: undefined,
    },
  });

  const url = watch("api.url");
  /**const { data: providers } = useProviders(watch("api"));
  console.log({ providers }); */
  useEffect(() => {
    if (url) {
      clearErrors("api");
      fetch(`${url}/server/health`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status !== "ok") {
            setError("api", { message: t("form.errors.apiNotHealthy") });
          }
        })
        .catch(() => {
          setError("api", { message: t("form.errors.apiNotHealthy") });
        });
    }
  }, [url]);

  useEffect(() => {
    console.log({ api });
    if (api) {
      setValue("api", api);

      const check = async () => {
        try {
          const url = api?.url;
          if (!url) return setHasRefreshToken(false);
          const key = `directus_session_token:${encodeURIComponent(url)}`;
          const raw = await AsyncStorage.getItem(key);
          if (!raw) return setHasRefreshToken(false);
          const session = JSON.parse(raw) as { refresh_token?: string | null } | null;
          console.log({ session });
          setHasRefreshToken(!!session?.refresh_token);
        } catch {
          setHasRefreshToken(false);
        }
      };
      check();
    } else {
      setHasRefreshToken(false);
    }
  }, [api?.url]);
  const { t } = useTranslation();

  const mutateApi = mutateLocalStorage(LocalStorageKeys.DIRECTUS_API_ACTIVE);

  const onSubmit = async (data: LoginFormData) => {
    if (data.type === "email") {
      try {
        console.log({ data });
        await login(data.email, data.password, data.api.url);
        mutateApi.mutate({ ...data.api, authType: "email" });
        router.push("/");
      } catch (error) {
        Alert.alert("Error", t("form.errors.loginFailed"));
      }
    } else if (data.type === "apiKey") {
      try {
        console.log({ data });
        await setApiKey(data.apiKey, data.api.url);
        mutateApi.mutate({ ...data.api, authType: "apiKey" });
        router.push("/");
      } catch (error) {
        Alert.alert("Error", t("form.errors.loginFailed"));
      }
    }
  };

  const ProviderButton = ({ provider }: { provider: ReadProviderOutput }) => {
    const discovery = useAutoDiscovery(
      `${watch("api.url")}/auth/login/${provider.name}`,
    );
    return (
      <Button
        key={provider.name}
        variant="soft"
        onPress={() => {
          Linking.openURL(
            `${watch("api.url")}/auth/login/${
              provider.name
            }?redirect=https://directusmobile.app/app-link/auth/login/callback`,
          );
        }}
      >
        Login with {provider.name}
      </Button>
    );
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
          <APISelect value={value} onChange={onChange} error={error?.message} />
        )}
      />

      <Controller
        control={control}
        rules={{
          required: t("form.errors.loginTypeRequired"),
        }}
        name="type"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <Select
            options={["email", "apiKey"].map((type) => ({
              value: type,
              text: type.charAt(0).toUpperCase() + type.slice(1),
            }))}
            label={t("form.loginType")}
            value={value}
            onValueChange={(value) => onChange(value as "email" | "apiKey")}
            error={error?.message}
          />
        )}
      />

      {watch("type") === "apiKey" && (
        <>
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
              />
            )}
          />
        </>
      )}

      {watch("type") === "email" && (
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

      <Button loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
        {t("form.login")}
      </Button>

      {hasRefreshToken && (
        <Button
          onPress={() => {
            refreshSession()
              .then((ok) => {
                if (ok) {
                  Alert.alert("Success", "Session refreshed");
                  router.push("/");
                } else {
                  Alert.alert(
                    "Cannot refresh",
                    "No refresh token found for the selected API. Please login again."
                  );
                }
              })
              .catch(() => {
                Alert.alert("Error", "Failed to refresh session");
              });
          }}
        >
          Refresh
        </Button>
      )}

      {/** <Vertical>
        {map(providers?.items, (provider) => (
          <ProviderButton key={provider.name} provider={provider} />
        ))}
      </Vertical> */}
    </View>
  );
};
