import {
  LocalStorageKeys,
  mutateLocalStorage,
  useLocalStorage,
} from "@/state/local/useLocalStorage";
import { Select } from "./interfaces/select";
import { API } from "./APIForm";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";

export function ApiSwitch() {
  const { data: apis } = useLocalStorage<API[]>(LocalStorageKeys.DIRECTUS_APIS);
  const { data: activeApi } = useLocalStorage<API>(
    LocalStorageKeys.DIRECTUS_API_ACTIVE,
  );
  const mutateApi = mutateLocalStorage(LocalStorageKeys.DIRECTUS_API_ACTIVE);
  const { refreshSession } = useAuth();

  return (
    <Select
      options={
        apis?.map((api) => ({
          value: api.url,
          text: api.name,
        })) ?? []
      }
      value={activeApi?.url}
      onValueChange={(value) => {
        const selected = apis?.find((api) => api.url === value);
        if (!selected) return;
        refreshSession(selected).then((result) => {
          if (result.ok) {
            mutateApi.mutate({
              ...selected,
              authType: result.authType,
            });
          } else {
            mutateApi.mutate(selected);
            router.push("/login");
          }
        });
      }}
    />
  );
}
