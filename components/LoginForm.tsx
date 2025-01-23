import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
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
    if (
      !/^https:\/\/[a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/.test(
        data.api.url
      )
    ) {
      setError("api", { message: t("form.errors.apiNotValid") });
      console.log(data);
      Alert.alert("Error", t("form.errors.apiNotValid"));
      return;
    }
    try {
      console.log({ data });
      await login(data.email, data.password, data.api.url);
      mutateApi.mutate(data.api);
      router.push("/");
    } catch (error) {
      Alert.alert("Error", t("form.errors.loginFailed"));
    }
  };

  return (
    <View style={{ ...styles.form, minWidth: 300 }}>
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

      <Button loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
        {t("form.login")}
      </Button>
    </View>
  );
};
