import React from "react";
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
import { Layout } from "./layout/Layout";
import { Container } from "./layout/Container";
import { Center } from "./layout/Center";
import { useTranslation } from "react-i18next";

interface LoginForm {
  email: string;
  password: string;
  apiUrl: string;
}

export const LoginForm = () => {
  const { styles } = useStyles(formStyles);
  const { login } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: {
      email: "",
      password: "",
      apiUrl: "https://api.example.com",
    },
  });
  const { t } = useTranslation();

  const onSubmit = async (data: LoginForm) => {
    try {
      console.log({ data });
      await login(data.email, data.password, data.apiUrl);
    } catch (error) {
      Alert.alert("Error", "Login failed. Please check your credentials.");
    }
  };

  return (
    <Form control={control} style={{ ...styles.form, minWidth: 300 }}>
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
        rules={{ required: t("form.errors.apiUrlRequired") }}
        name="apiUrl"
        render={({ field: { onChange, value } }) => (
          <Input
            onChangeText={onChange}
            value={value}
            placeholder={t("form.apiUrl")}
            label={t("form.apiUrl")}
            error={errors.apiUrl?.message}
            autoCapitalize="none"
          />
        )}
      />

      <Button loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
        {t("form.login")}
      </Button>
    </Form>
  );
};
