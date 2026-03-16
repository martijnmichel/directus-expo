# Latest Items Widget (iOS)

This WidgetKit extension shows latest Directus items. Configuration is driven by the main app via App Group storage.

## Why is the widget in `targets/` and not `ios/`?

- **Widget extension** (this folder, `targets/latest-items-widget/`): The **@bacons/apple-targets** plugin discovers extension targets by scanning the `targets/` directory for `expo-target.config.js` and wires each folder into the Xcode project as a separate target (the `.appex`). The plugin is built around this layout, so the widget Swift code lives here.
- **Main-app native module** (`ios/DirectusMobile/WidgetSharedStorage.m`): That code runs in the **main app** and writes the config list to the App Group so the widget extension can read it. It’s a normal React Native native module in the main app target, so it lives under `ios/`. We can’t move the widget extension into `ios/` without dropping the plugin and maintaining the widget target and its file references by hand.

## How the widget gets the Directus API URL

The widget **does not** store the Directus API base URL as a separate setting. Each “widget setup” in the app includes a **webhook URL** (the flow trigger URL, e.g. `https://your-directus.com/flows/trigger/xxx`). The app writes the list of setups (with `id`, `title`, `instanceUrl`, `collection`, `widgetId`, `webhookUrl`) to App Group. The widget uses `config.webhookUrl` to POST `{ "widget_id": "..." }` to your Directus flow and receives the payload. So the widget knows where to call only through the webhook URL in that shared config list.

## Setup picker (“Setup” on the widget)

When the user adds the widget and taps **Setup**, the system shows a list of setups. That list comes from **App Group** (the same config list written by the main app).

- **You must add at least one “widget setup” in the app** (Settings → Widget) before the Setup picker will show any options. The app syncs that list to shared storage when you open widget settings and when you save.
- If Setup still shows nothing or doesn’t open, try: (1) Open the main app and go to Settings → Widget so it writes the config list, then add the widget again; (2) Test on a **real device**; (3) Rebuild and reinstall the app (simulator can have intent discovery quirks).

The configuration intent is implemented in this target (`LatestItemsWidgetConfigurationIntent`, `LatestItemsConfigEntity`, `LatestItemsConfigQuery`). The system discovers it from the widget extension; no extra Info.plist entries are required for App Intents.
