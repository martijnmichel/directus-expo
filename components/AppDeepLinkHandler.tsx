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
import { resolveActiveSessionContext } from "@/state/auth/resolveActiveSession";

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
        const parsed = await handleIncomingDeepLinkUrl(url);
        if (!parsed) return;

        const ctx = await resolveActiveSessionContext();
        if (!ctx) {
          router.replace("/login");
          return;
        }
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
