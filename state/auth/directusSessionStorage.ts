import type { AuthenticationData } from "@directus/sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Persisted at `directus_session:<sessionId>` */
export type DirectusSessionWrapper = {
  apiId: string;
  authType: "email" | "apiKey";
  sdk?: AuthenticationData | null;
  apiKey?: string | null;
  userLabel?: string;
  /** Fallback base URL if the @directus-apis row was removed */
  instanceUrl?: string;
};

export function directusSessionStorageKey(sessionId: string): string {
  return `directus_session:${sessionId}`;
}

export async function readSessionWrapper(
  sessionId: string,
): Promise<DirectusSessionWrapper | null> {
  try {
    const raw = await AsyncStorage.getItem(directusSessionStorageKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as DirectusSessionWrapper;
  } catch {
    return null;
  }
}

export async function writeSessionWrapper(
  sessionId: string,
  wrapper: DirectusSessionWrapper,
): Promise<void> {
  await AsyncStorage.setItem(
    directusSessionStorageKey(sessionId),
    JSON.stringify(wrapper),
  );
}

export async function clearSessionStorage(sessionId: string): Promise<void> {
  await AsyncStorage.removeItem(directusSessionStorageKey(sessionId));
}
