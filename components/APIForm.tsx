import {
  LocalStorageKeys,
  mutateLocalStorage,
  useLocalStorage,
} from "@/state/local/useLocalStorage";
import { useStyles } from "react-native-unistyles";
import { formStyles } from "./form/style";
import { Controller } from "react-hook-form";
import { Input } from "./form/input";
import { Select } from "./form/select";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Horizontal, Vertical } from "./layout/Stack";
import { Modal } from "./display/modal";
import { Button } from "./display/button";
import { Alert } from "react-native";
import { Check, Edit } from "./icons";
import { useEffect } from "react";

export type API = {
  name: string;
  url: string;
};
export const APIForm = ({ defaultValues }: { defaultValues?: API }) => {
  const { data, refetch } = useLocalStorage<API[]>(
    LocalStorageKeys.DIRECTUS_APIS,
    []
  );

  const { styles } = useStyles(formStyles);

  const { t } = useTranslation();

  const form = useForm<API>({ defaultValues });

  const { mutate: mutateApis } = mutateLocalStorage(
    LocalStorageKeys.DIRECTUS_APIS
  );

  const onSubmit = async (newApi: API) => {
    /** test working api */
    try {
      const test = await fetch(`${newApi.url}/server/health`);
      if (!test.ok) {
        throw new Error("API is not working");
      }
      mutateApis([...(data ?? []), newApi]);
      form.reset();
      refetch();
    } catch (error) {
      form.setError(
        "url",
        { message: "API is not valid" },
        { shouldFocus: true }
      );
      Alert.alert("Error", "API is not working");
    }
  };

  return (
    <Vertical>
      <Controller
        control={form.control}
        name="name"
        render={({ field: { onChange, value }, fieldState }) => (
          <Input
            onChangeText={onChange}
            value={value}
            error={fieldState?.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="url"
        render={({ field: { onChange, value }, fieldState }) => (
          <Input
            onChangeText={onChange}
            value={value}
            error={fieldState?.error?.message}
          />
        )}
      />
      <Horizontal style={{ justifyContent: "flex-end" }}>
        <Button
          disabled={!form.formState.isValid || !form.formState.isDirty}
          loading={form.formState.isSubmitting}
          rounded
          onPress={form.handleSubmit(onSubmit)}
        >
          <Check />
        </Button>
      </Horizontal>
    </Vertical>
  );
};
