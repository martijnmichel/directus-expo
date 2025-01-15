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
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
export type API = {
  name: string;
  url: string;
  id?: string;
};
export const APIForm = ({
  defaultValues,
  id,
  onSuccess,
}: {
  defaultValues?: API;
  id?: string;
  onSuccess?: () => void;
}) => {
  const { data, refetch } = useLocalStorage<API[]>(
    LocalStorageKeys.DIRECTUS_APIS,
    []
  );

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
      if (!newApi.id) {
        mutateApis([...(data ?? []), { ...newApi, id: uuidv4() }]);
      } else {
        mutateApis([
          ...(data ?? []).filter((api) => api.id !== newApi.id),
          newApi,
        ]);
      }
      form.reset();
      refetch();
      onSuccess?.();
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
            autoComplete="url"
            autoCapitalize="none"
          />
        )}
      />
      <Horizontal style={{ justifyContent: "flex-end" }}>
        <Button
          disabled={
            !form.formState.isValid ||
            !form.formState.isDirty ||
            form.formState.isSubmitting
          }
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
