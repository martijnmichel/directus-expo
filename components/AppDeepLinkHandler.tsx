import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  handleIncomingDeepLinkUrl,
  parseDirectusDeepLink,
  setPendingDeepLinkHref,
  subscribeToDeepLinks,
  takePendingDeepLinkHref,
} from "@/state/linking/deepLinks";
import {
  resolveActiveSessionContext,
  resolveSessionContextForSessionId,
} from "@/state/auth/resolveActiveSession";

function getServerLabel(rawUrl: string): string {
  try {
    return new URL(rawUrl).host;
  } catch {
    return rawUrl;
  }
}

/**
 * Handles `directus://…` in-app links (content items, widgets, etc.):
 * after sign-in, navigates to a pending route; while running, applies session + refresh + navigate or login.
 */
export function AppDeepLinkHandler() {
  const { isAuthenticated, isLoading, refreshSession } = useAuth();
  const router = useRouter();
  const inFlightRef = useRef(false);
  const lastHandledUrlRef = useRef<string | null>(null);
  const lastHandledAtRef = useRef(0);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    const pending = takePendingDeepLinkHref();
    if (pending) {
      router.replace(pending as any);
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const { remove } = subscribeToDeepLinks((url) => {
      const parsedGate = parseDirectusDeepLink(url);
      if (!parsedGate) return;
      // Content links without sessionId are ignored — processing triggers refreshSession and can
      // land on /login and wipe storage on failure (e.g. widget row URLs missing ?sessionId=).
      if (!parsedGate.sessionId?.trim()) return;

      const now = Date.now();
      const isDuplicate =
        lastHandledUrlRef.current === url && now - lastHandledAtRef.current < 1500;
      if (isDuplicate || inFlightRef.current) return;

      void (async () => {
        inFlightRef.current = true;
        lastHandledUrlRef.current = url;
        lastHandledAtRef.current = now;
        try {
          const previousCtx = await resolveActiveSessionContext();
          const parsed = await handleIncomingDeepLinkUrl(url);
          if (!parsed) return;

          const ctx = await resolveSessionContextForSessionId(
            parsed.sessionId!.trim(),
          );
          if (!ctx) {
            router.replace("/login");
            return;
          }
          const switchedSessionOrServer =
            !!previousCtx &&
            (previousCtx.sessionId !== ctx.sessionId ||
              previousCtx.api.url !== ctx.api.url);
          router.replace({
            pathname: "/deeplink-loading",
            params: {
              collection: parsed.collection,
              switching: switchedSessionOrServer ? "1" : "0",
              server: getServerLabel(ctx.api.url),
              account: ctx.wrapper.userLabel?.trim() || "",
            },
          } as any);
          const result = await refreshSession({
            url: ctx.api.url,
            sessionId: ctx.sessionId,
          });
          if (result.ok) {
            setPendingDeepLinkHref(null);
            router.replace(parsed.href as any);
          } else {
            router.replace("/login");
          }
        } catch {
          router.replace("/login");
        } finally {
          inFlightRef.current = false;
        }
      })();
    });
    return remove;
  }, [refreshSession, router]);

  return null;
}
