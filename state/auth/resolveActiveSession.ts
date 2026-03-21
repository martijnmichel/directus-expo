import AsyncStorage from "@react-native-async-storage/async-storage";
import { LocalStorageKeys } from "@/state/local/useLocalStorage";
import type { API } from "@/components/APIForm";
import {
  readSessionWrapper,
  type DirectusSessionWrapper,
} from "@/state/auth/directusSessionStorage";

/** Previous key; may still hold a full object from older builds */
const LEGACY_DIRECTUS_API_ACTIVE = "@directus-api-active";

/** Normalize stored value: plain UUID or JSON-stringified id */
export function normalizeStoredSessionId(raw: string | null): string | null {
  if (raw == null || !String(raw).trim()) return null;
  const s = String(raw).trim();
  try {
    const p = JSON.parse(s);
    if (typeof p === "string" && p.trim()) return p.trim();
  } catch {
    /* plain string */
  }
  return s;
}

/**
 * If the new key is empty but legacy `@directus-api-active` has `{ sessionId }`, copy session id and remove legacy.
 */
export async function ensureLegacyActiveSessionMigrated(): Promise<void> {
  const current = await AsyncStorage.getItem(
    LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID,
  );
  if (normalizeStoredSessionId(current)) return;

  const oldRaw = await AsyncStorage.getItem(LEGACY_DIRECTUS_API_ACTIVE);
  if (!oldRaw?.trim()) return;

  try {
    const parsed = JSON.parse(oldRaw) as { sessionId?: string };
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.sessionId === "string" &&
      parsed.sessionId.trim()
    ) {
      await AsyncStorage.setItem(
        LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID,
        parsed.sessionId.trim(),
      );
      await AsyncStorage.removeItem(LEGACY_DIRECTUS_API_ACTIVE);
    }
  } catch {
    /* legacy not JSON or wrong shape — leave both keys alone */
  }
}

export async function readActiveSessionId(): Promise<string | null> {
  await ensureLegacyActiveSessionMigrated();
  const raw = await AsyncStorage.getItem(
    LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID,
  );
  return normalizeStoredSessionId(raw);
}

export type ResolvedActiveSession = {
  sessionId: string;
  wrapper: DirectusSessionWrapper;
  api: API;
};

/** Resolve API + wrapper for a known session id (e.g. from a deep link). */
export async function resolveSessionContextForSessionId(
  sessionId: string,
): Promise<ResolvedActiveSession | null> {
  const sid = sessionId.trim();
  if (!sid) return null;

  const wrapper = await readSessionWrapper(sid);
  if (!wrapper?.apiId) return null;

  const apisRaw = await AsyncStorage.getItem(LocalStorageKeys.DIRECTUS_APIS);
  let apis: API[] = [];
  try {
    apis = apisRaw ? (JSON.parse(apisRaw) as API[]) : [];
    if (!Array.isArray(apis)) apis = [];
  } catch {
    return null;
  }

  const api = apis.find((a) => a.id === wrapper.apiId);
  const url = api?.url ?? wrapper.instanceUrl;
  if (!url) return null;

  const mergedApi: API = {
    name: api?.name ?? "",
    url,
    id: wrapper.apiId,
    sessionIds: api?.sessionIds ?? [],
  };

  return { sessionId: sid, wrapper, api: mergedApi };
}

export async function resolveActiveSessionContext(): Promise<ResolvedActiveSession | null> {
  await ensureLegacyActiveSessionMigrated();
  const sessionId = await readActiveSessionId();
  if (!sessionId) return null;
  return resolveSessionContextForSessionId(sessionId);
}
