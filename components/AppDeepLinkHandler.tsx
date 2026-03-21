import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import ToastManager from "@/utils/toast";
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

function describeSessionTarget(
  userLabel: string | undefined,
  apiUrl: string,
): string {
  const user = userLabel?.trim() || "account";
  try {
    const host = new URL(apiUrl).host;
    return `${user} on ${host}`;
  } catch {
    return `${user} on ${apiUrl}`;
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
        const ctx = sidFromLink
          ? await resolveSessionContextForSessionId(sidFromLink)
          : await resolveActiveSessionContext();
        if (!ctx) {
          router.replace("/login");
          return;
        }
        const switchedSessionOrServer =
          !!previousCtx &&
          (previousCtx.sessionId !== ctx.sessionId ||
            previousCtx.api.url !== ctx.api.url);
        const result = await refreshSession({
          url: ctx.api.url,
          sessionId: ctx.sessionId,
        });
        if (result.ok) {
          if (switchedSessionOrServer) {
            ToastManager.success({
              message: "Switched account from deep link",
              description: `Now using ${describeSessionTarget(ctx.wrapper.userLabel, ctx.api.url)}.`,
            });
          }
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
