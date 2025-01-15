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
import { Input } from "./form/input";
import { Button } from "./display/button";
import { useStyles } from "react-native-unistyles";
import { formStyles } from "./form/style";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { API, APISelect } from "./APISelect";
import {
  mutateLocalStorage,
  useLocalStorage,
} from "@/state/local/useLocalStorage";
import { LocalStorageKeys } from "@/state/local/useLocalStorage";
import { ErrorList } from "./form/ErrorList";

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
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: __DEV__
      ? {
          email: "martijn.michel@gmail.com",
          password: "CB4i79%jcfCF2q",
          api: {
            name: "Directus Expo Test",
            url: "https://directus-expo-test.martijnvde.nl",
          },
        }
      : {
          email: "",
          password: "",
          api: undefined,
        },
  });

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
      setError("api.url", { message: "Invalid API URL" });
      return;
    }
    try {
      console.log({ data });
      await login(data.email, data.password, data.api.url);
      mutateApi.mutate(data.api);
      router.push("/");
    } catch (error) {
      Alert.alert("Error", "Login failed. Please check your credentials.");
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
        render={({ field: { onChange, value } }) => (
          <APISelect value={value} onChange={onChange} />
        )}
      />

      <Button loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
        {t("form.login")}
      </Button>
    </View>
  );
};
