/**
 * Android widget pinning has been removed.
 *
 * Keep this function as a no-op for backwards compatibility with the UI.
 */
export async function requestAddWidgetToHomeScreen(): Promise<{
  requested: boolean;
}> {
  return { requested: false };
}
