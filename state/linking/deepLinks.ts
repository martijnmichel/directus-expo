import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { LocalStorageKeys } from "@/state/local/useLocalStorage";
import { queryClient } from "@/utils/react-query";

/**
 * Result of parsing an in-app `directus://` URL (widgets, notifications, external links, etc.).
 * Extend {@link parseDirectusDeepLink} when adding new route patterns.
 */
export type ParsedDirectusDeepLink = {
  collection: string;
  itemId: string;
  sessionId?: string;
  /** expo-router href */
  href: string;
};

let pendingDeepLinkHref: string | null = null;

export function setPendingDeepLinkHref(href: string | null): void {
  pendingDeepLinkHref = href;
}

export function takePendingDeepLinkHref(): string | null {
  const h = pendingDeepLinkHref;
  pendingDeepLinkHref = null;
  return h;
}

export function peekPendingDeepLinkHref(): string | null {
  return pendingDeepLinkHref;
}

/**
 * `directus://content/{collection}/{itemId}?sessionId=...`
 * (`scheme` in app.config.js). Also accepts `exp+directus://` dev-client prefixes.
 */
export function parseDirectusDeepLink(rawUrl: string): ParsedDirectusDeepLink | null {
  const url = rawUrl?.trim();
  if (!url) return null;

  const normalized = url.replace(/^exp\+directus:\/\//i, "directus://");
  const m = normalized.match(
    /^directus:\/\/content\/([^/]+)\/([^/?#]+)(?:\?([^#]*))?/i,
  );
  if (!m) return null;

  const collection = decodeURIComponent(m[1]);
  const itemId = decodeURIComponent(m[2]);
  const qs = m[3] ?? "";
  let sessionId: string | undefined;
  try {
    sessionId =
      new URLSearchParams(qs).get("sessionId")?.trim() || undefined;
  } catch {
    sessionId = undefined;
  }

  const href = `/content/${encodeURIComponent(collection)}/${encodeURIComponent(itemId)}`;
  return { collection, itemId, sessionId, href };
}

/**
 * Cold start: optional `sessionId` query → storage; queue navigation for after auth.
 */
export async function applyInitialDeepLinkFromUrl(
  url: string | null | undefined,
): Promise<void> {
  const parsed = url ? parseDirectusDeepLink(url) : null;
  if (!parsed) return;

  if (parsed.sessionId) {
    await AsyncStorage.setItem(
      LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID,
      parsed.sessionId,
    );
    await queryClient.invalidateQueries({
      queryKey: ["resolved-active-session"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["local-storage", LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID],
    });
  }
  setPendingDeepLinkHref(parsed.href);
}

/**
 * Warm open while app is running: persist optional `sessionId` from URL.
 * Does **not** set {@link pendingDeepLinkHref} — the in-app handler navigates after
 * `refreshSession`, otherwise a separate effect can consume pending first and open the
 * item with the previous Directus client.
 */
export async function handleIncomingDeepLinkUrl(
  url: string,
): Promise<ParsedDirectusDeepLink | null> {
  const parsed = parseDirectusDeepLink(url);
  if (!parsed) return null;

  if (parsed.sessionId) {
    await AsyncStorage.setItem(
      LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID,
      parsed.sessionId,
    );
    await queryClient.invalidateQueries({
      queryKey: ["resolved-active-session"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["local-storage", LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID],
    });
  }
  return parsed;
}

export function subscribeToDeepLinks(
  handler: (url: string) => void,
): { remove: () => void } {
  const sub = Linking.addEventListener("url", ({ url }) => {
    if (url) handler(url);
  });
  return { remove: () => sub.remove() };
}
