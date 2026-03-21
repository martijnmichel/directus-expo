import {
  LocalStorageKeys,
  mutateLocalStorage,
  useLocalStorage,
} from "@/state/local/useLocalStorage";
import { useTranslation } from "react-i18next";
import { Horizontal, Vertical } from "./layout/Stack";
import { Modal } from "./display/modal";
import { Button } from "./display/button";
import { Edit, Plus, Trash } from "./icons";
import { API, APIForm } from "./APIForm";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { ConfirmDialog } from "./display/confirm-dialog";
import { Select } from "./interfaces/select";
import { clearSessionStorage } from "@/state/auth/directusSessionStorage";

function normalizeApis(apis: API[] | undefined): API[] {
  return (apis ?? []).map((a) => ({
    ...a,
    sessionIds: a.sessionIds ?? [],
  }));
}

function encodePick(row: API): string | undefined {
  if (!row.id) return undefined;
  return row.id;
}

function decodePick(v: string, apis: API[]): API | undefined {
  return apis.find((a) => a.id === v);
}

export function APISelect({
  value,
  onChange,
  error,
}: {
  value?: API;
  onChange?: (value: API | undefined) => void;
  error?: string;
}) {
  const { data, refetch } = useLocalStorage<API[]>(
    LocalStorageKeys.DIRECTUS_APIS,
    undefined,
    [],
  );
  const confirm = useConfirmDialog();
  const mutateActiveSessionId = mutateLocalStorage(
    LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID,
  );
  const mutateApis = mutateLocalStorage(LocalStorageKeys.DIRECTUS_APIS);
  const { data: activeSessionId = "" } = useLocalStorage<string>(
    LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID,
    undefined,
    "",
  );

  const { t } = useTranslation();

  const apis = normalizeApis(data);
  const selectValue = value ? encodePick(value) : undefined;

  return (
    <Vertical>
      <Select
        onValueChange={(v) => {
          const selected = decodePick(String(v), apis);
          if (selected) {
            onChange?.(selected);
          }
        }}
        options={apis.map((api) => ({
          value: encodePick(api)!,
          text: api.name,
        }))}
        disabled={!apis.length}
        value={selectValue}
        placeholder={t("form.api")}
        label={t("form.api")}
        error={error}
      />
      <Horizontal>
        <Modal>
          <Modal.Trigger>
            <Button rounded>
              <Plus />
            </Button>
          </Modal.Trigger>
          <Modal.Content title={t("components.apiSelect.addApi")}>
            {({ close }) => (
              <APIForm
                onSuccess={(api) => {
                  close();
                  if (api.id) {
                    onChange?.({ ...api, sessionIds: api.sessionIds ?? [] });
                  }
                }}
              />
            )}
          </Modal.Content>
        </Modal>

        {!!value?.id && (
          <>
            <Modal>
              <Modal.Trigger>
                <Button rounded variant="soft">
                  <Edit />
                </Button>
              </Modal.Trigger>
              <Modal.Content title={t("components.apiSelect.editApi")}>
                {({ close }) => {
                  const inst = apis.find((a) => a.id === value.id);
                  if (!inst) return null;
                  return (
                    <APIForm defaultValues={inst} onSuccess={() => close()} />
                  );
                }}
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
                description={t("components.apiSelect.confirmDelete")}
                variant="danger"
                onConfirm={async () => {
                  if (!value?.id) return;
                  const row = apis.find((a) => a.id === value.id);
                  for (const sid of row?.sessionIds ?? []) {
                    await clearSessionStorage(sid);
                  }
                  const sid = String(activeSessionId ?? "").trim();
                  if (
                    sid &&
                    (row?.sessionIds?.includes(sid) ?? false)
                  ) {
                    mutateActiveSessionId.mutate(undefined);
                    onChange?.(undefined);
                  }
                  mutateApis.mutate(apis.filter((api) => api.id !== value.id));
                  refetch();
                }}
              />
            </ConfirmDialog>
          </>
        )}
      </Horizontal>
    </Vertical>
  );
}
