import { NativeModules, Platform } from "react-native";

/**
 * On Android (API 26+): asks the system to show the "pin widget" flow so the user
 * can add the Latest Items widget to the home screen in one tap from the app.
 * On iOS: no-op (widget must be added manually from the home screen).
 */
export async function requestAddWidgetToHomeScreen(): Promise<{
  requested: boolean;
  error?: string;
}> {
  if (Platform.OS !== "android") {
    return { requested: false };
  }
  const WidgetPin = (NativeModules as any).WidgetPin;
  if (!WidgetPin?.requestPinLatestItemsWidget) {
    return { requested: false, error: "Widget pin not available" };
  }
  try {
    await WidgetPin.requestPinLatestItemsWidget();
    return { requested: true };
  } catch (e: any) {
    return {
      requested: false,
      error: e?.message ?? String(e),
    };
  }
}
