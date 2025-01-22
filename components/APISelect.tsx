import {
  LocalStorageKeys,
  mutateLocalStorage,
  useLocalStorage,
} from "@/state/local/useLocalStorage";
import { useStyles } from "react-native-unistyles";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Horizontal, Vertical } from "./layout/Stack";
import { Modal } from "./display/modal";
import { Button } from "./display/button";
import { Alert } from "react-native";
import { Check, Edit, Plus, Trash } from "./icons";
import { useEffect } from "react";
import { API, APIForm } from "./APIForm";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { ConfirmDialog } from "./display/confirm-dialog";
import { Text } from "./display/typography";
import { Select } from "./interfaces/select";
export function APISelect({
  value,
  onChange,
}: {
  value?: API;
  onChange?: (value: API | undefined) => void;
}) {
  const { data, refetch } = useLocalStorage<API[]>(
    LocalStorageKeys.DIRECTUS_APIS,
    undefined,
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
            {({ close }) => <APIForm onSuccess={() => close()} />}
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
              <Modal.Content title={t("components.modal.editApi")}>
                {({ close }) => (
                  <APIForm defaultValues={value} onSuccess={() => close()} />
                )}
              </Modal.Content>
            </Modal>

            <ConfirmDialog>
              <ConfirmDialog.Trigger>
                <Button rounded variant="soft">
                  <Trash />
                </Button>
              </ConfirmDialog.Trigger>

              <ConfirmDialog.Content
                title={t("components.confirmDialog.delete")}
                description={t("components.confirmDialog.confirmDelete")}
                variant="danger"
                onConfirm={async () => {
                  const isActive = data?.find((api) => api.id === value.id);
                  if (isActive) {
                    mutateApi.mutate(undefined);
                    onChange?.(undefined);
                  }
                  mutateApis.mutate(data?.filter((api) => api.id !== value.id));
                }}
              />
            </ConfirmDialog>
          </>
        )}
      </Horizontal>
    </Vertical>
  );
}
