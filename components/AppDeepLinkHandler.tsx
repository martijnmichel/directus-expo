import { useEffect } from "react";
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

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    const pending = takePendingDeepLinkHref();
    if (pending) {
      router.replace(pending as any);
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const { remove } = subscribeToDeepLinks((url) => {
      if (!parseDirectusDeepLink(url)) return;

      void (async () => {
        const previousCtx = await resolveActiveSessionContext();
        const parsed = await handleIncomingDeepLinkUrl(url);
        if (!parsed) return;

        const sidFromLink = parsed.sessionId?.trim();
        const deepLinkCtx = sidFromLink
          ? await resolveSessionContextForSessionId(sidFromLink)
          : null;
        const ctx = deepLinkCtx ?? (await resolveActiveSessionContext());
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
      })();
    });
    return remove;
  }, [refreshSession, router]);

  return null;
}
