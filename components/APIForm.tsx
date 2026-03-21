import {
  LocalStorageKeys,
  mutateLocalStorage,
  useLocalStorage,
} from "@/state/local/useLocalStorage";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Horizontal, Vertical } from "./layout/Stack";
import { Modal } from "./display/modal";
import { Button } from "./display/button";
import { Check, Edit } from "./icons";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { Input } from "./interfaces/input";

export type API = {
  name: string;
  url: string;
  id?: string;
  /** Login slots for this instance; tokens live in `directus_session:<id>` */
  sessionIds?: string[];
};

export const APIForm = ({
  defaultValues,
  onSuccess,
}: {
  defaultValues?: API;
  onSuccess?: (api: API) => void;
}) => {
  const { data, refetch } = useLocalStorage<API[]>(
    LocalStorageKeys.DIRECTUS_APIS,
    undefined,
    [],
  );

  const form = useForm<API>({
    defaultValues: defaultValues ?? { url: "https://" },
  });

  const { mutate: mutateApis } = mutateLocalStorage(
    LocalStorageKeys.DIRECTUS_APIS,
  );

  const onSubmit = async (newApi: API) => {
    try {
      const url = new URL(newApi.url);
      newApi.url = url.href.replace(/\/$/, "");
    } catch {
      form.setError("url", { message: "Invalid URL" }, { shouldFocus: true });
      return;
    }
    try {
      const test = await fetch(`${newApi.url}/server/health`);
      if (!test.ok) {
        throw new Error(
          "Host is not reachable. There might be something wrong with your config.",
        );
      }

      const existingId = defaultValues?.id;
      const existingRow =
        data?.find((a) => a.id === existingId) ?? defaultValues;
      const sessionIds =
        existingId && existingRow?.sessionIds
          ? [...existingRow.sessionIds]
          : newApi.sessionIds ?? [];

      const saved: API = !existingId
        ? { ...newApi, id: uuidv4(), sessionIds: [] }
        : { ...newApi, id: existingId, sessionIds };

      if (!existingId) {
        mutateApis([...(data ?? []), saved]);
      } else {
        mutateApis([
          ...(data ?? []).filter((api) => api.id !== existingId),
          saved,
        ]);
      }
      form.reset();
      refetch();
      onSuccess?.(saved);
    } catch (error) {
      if (error instanceof Error) {
        form.setError(
          "url",
          {
            message: `${error.message}. Check the /server/health path of your instance.`,
          },
          { shouldFocus: true },
        );
      }
    }
  };

  const { t } = useTranslation();

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
            label={t("form.apiName")}
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
            label={t("form.apiUrl")}
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
