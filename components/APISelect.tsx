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
import { Check, Edit, Plus, Trash } from "./icons";
import { useEffect } from "react";
import { APIForm } from "./APIForm";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { ConfirmDialog } from "./display/confirm-dialog";

export type API = {
  name: string;
  url: string;
};
export function APISelect({
  value,
  onChange,
}: {
  value?: API;
  onChange?: (value: API | undefined) => void;
}) {
  const { data, refetch } = useLocalStorage<API[]>(
    LocalStorageKeys.DIRECTUS_APIS,
    []
  );
  const confirm = useConfirmDialog();
  const mutateApi = mutateLocalStorage(LocalStorageKeys.DIRECTUS_API_ACTIVE);
  const mutateApis = mutateLocalStorage(LocalStorageKeys.DIRECTUS_APIS);

  const { t } = useTranslation();

  return (
    <Vertical>
      <Select
        onValueChange={(_, index) => onChange && onChange(data?.[index])}
        options={
          data?.map((api) => ({
            value: api.url,
            text: api.name,
          })) ?? []
        }
        disabled={!data?.length}
        value={value?.url}
        placeholder={t("form.api")}
        label={t("form.api")}
      />
      <Horizontal>
        <Modal>
          <Modal.Trigger>
            <Button rounded>
              <Plus />
            </Button>
          </Modal.Trigger>
          <Modal.Content title="Add API">
            <APIForm />
          </Modal.Content>
        </Modal>

        {!!value && (
          <>
            <Modal>
              <Modal.Trigger>
                <Button rounded variant="soft">
                  <Edit />
                </Button>
              </Modal.Trigger>
              <Modal.Content title="Edit API">
                <APIForm defaultValues={value} />
              </Modal.Content>
            </Modal>

            <ConfirmDialog>
              <ConfirmDialog.Trigger>
                <Button rounded variant="soft">
                  <Trash />
                </Button>
              </ConfirmDialog.Trigger>

              <ConfirmDialog.Content
                title="Delete Item"
                description="Are you sure you want to delete this item? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={async () => {
                  const isActive = data?.find((api) => api.url === value.url);
                  if (isActive) {
                    mutateApi.mutate(undefined);
                  }
                  mutateApis.mutate(
                    data?.filter((api) => api.url !== value.url)
                  );
                }}
              />
            </ConfirmDialog>
          </>
        )}
      </Horizontal>
    </Vertical>
  );
}
