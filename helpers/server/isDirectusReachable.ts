/**
 * Unauthenticated liveness check that works on Directus before and after v12.
 * Prefer `/server/ping` (public on all versions). Fall back to `/server/health`
 * for older instances where ping is blocked or unavailable; health is public
 * pre-v12 and requires auth on v12+.
 */
export async function isDirectusReachable(baseUrl: string): Promise<boolean> {
  const base = baseUrl.replace(/\/$/, "");

  try {
    const ping = await fetch(`${base}/server/ping`);
    if (ping.ok && (await ping.text()).trim() === "pong") {
      return true;
    }
  } catch {
    // try health fallback
  }

  try {
    const health = await fetch(`${base}/server/health`);
    if (!health.ok) return false;
    const data = (await health.json()) as { status?: string };
    return data?.status === "ok";
  } catch {
    return false;
  }
}
