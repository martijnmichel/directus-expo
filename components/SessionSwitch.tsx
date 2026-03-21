import {
  LocalStorageKeys,
  mutateLocalStorage,
  useLocalStorage,
} from "@/state/local/useLocalStorage";
import { Select } from "./interfaces/select";
import { API } from "./APIForm";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";

function normalizeApis(apis: API[] | undefined): API[] {
  return (apis ?? []).map((a) => ({
    ...a,
    sessionIds: a.sessionIds ?? [],
  }));
}

function encodeSessionPick(api: API, sessionId: string): string {
  return `s:${api.id}:${sessionId}`;
}

export function ApiSwitch() {
  const { data: apisRaw } = useLocalStorage<API[]>(
    LocalStorageKeys.DIRECTUS_APIS,
    undefined,
    [],
  );
  const { data: activeSessionId = "" } = useLocalStorage<string>(
    LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID,
    undefined,
    "",
  );
  const mutateActiveSessionId = mutateLocalStorage(
    LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID,
  );
  const { refreshSession } = useAuth();
  const apis = normalizeApis(apisRaw);

  const sessionRows = apis.flatMap((api) =>
    (api.sessionIds ?? []).map((sessionId) => ({
      api,
      sessionId,
      value: encodeSessionPick(api, sessionId),
      text: `${api.name} (saved session)`,
    })),
  );

  const sid = String(activeSessionId ?? "").trim();
  let selectValue: string | undefined;
  if (sid) {
    for (const api of apis) {
      if (api.id && api.sessionIds?.includes(sid)) {
        selectValue = encodeSessionPick(api, sid);
        break;
      }
    }
  }

  return (
    <Select
      options={sessionRows.map((r) => ({
        value: r.value,
        text: r.text,
      }))}
      value={selectValue}
      disabled={!sessionRows.length}
      onValueChange={(v) => {
        const str = String(v);
        if (!str.startsWith("s:")) return;
        const rest = str.slice(2);
        const idx = rest.indexOf(":");
        if (idx === -1) return;
        const apiId = rest.slice(0, idx);
        const sessionId = rest.slice(idx + 1);
        const selected = apis.find((a) => a.id === apiId);
        if (!selected?.sessionIds?.includes(sessionId)) return;

        refreshSession({ url: selected.url, sessionId }).then((result) => {
          if (result.ok) {
            mutateActiveSessionId.mutate(sessionId);
          } else {
            mutateActiveSessionId.mutate(sessionId);
            router.push("/login");
          }
        });
      }}
    />
  );
}
