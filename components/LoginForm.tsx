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

WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri();

interface LoginForm {
  email: string;
  password: string;
  api: API;
}

export const LoginForm = () => {
  const { styles } = useStyles(formStyles);
  const { login } = useAuth();
  const { data: api } = useLocalStorage<API>(
    LocalStorageKeys.DIRECTUS_API_ACTIVE
  );

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: __DEV__
      ? {
          email: "martijn.michel@gmail.com",
          password: "CB4i79%jcfCF2q",
          api: undefined,
        }
      : {
          email: "",
          password: "",
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
    if (api) {
      setValue("api", api);
    }
  }, [api]);
  const { t } = useTranslation();

  const mutateApi = mutateLocalStorage(LocalStorageKeys.DIRECTUS_API_ACTIVE);

  const onSubmit = async (data: LoginForm) => {
    try {
      console.log({ data });
      await login(data.email, data.password, data.api.url);
      mutateApi.mutate(data.api);
      router.push("/");
    } catch (error) {
      Alert.alert("Error", t("form.errors.loginFailed"));
    }
  };

  const ProviderButton = ({ provider }: { provider: ReadProviderOutput }) => {
    const discovery = useAutoDiscovery(
      `${watch("api.url")}/auth/login/${provider.name}`
    );
    return (
      <Button
        key={provider.name}
        variant="soft"
        onPress={() => {
          Linking.openURL(
            `${watch("api.url")}/auth/login/${
              provider.name
            }?redirect=https://directusmobile.app/app-link/auth/login/callback`
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
        rules={{ required: t("form.errors.emailRequired") }}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            onChangeText={onChange}
            value={value}
            placeholder={t("form.email")}
            label={t("form.email")}
            error={errors.email?.message}
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
        render={({ field: { onChange, value } }) => (
          <Input
            onChangeText={onChange}
            value={value}
            placeholder={t("form.password")}
            label={t("form.password")}
            error={errors.password?.message}
            autoComplete="password"
            secureTextEntry
          />
        )}
      />

      <Button loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
        {t("form.login")}
      </Button>

      {/** <Vertical>
        {map(providers?.items, (provider) => (
          <ProviderButton key={provider.name} provider={provider} />
        ))}
      </Vertical> */}
    </View>
  );
};
