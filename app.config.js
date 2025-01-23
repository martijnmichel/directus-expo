const packageJson = require("./package.json");
const buildNumber = 3;

export default () => ({
  expo: {
    name: "directus-expo",
    slug: "directus-expo",
    version: packageJson.version,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      buildNumber: `${buildNumber}`,
      bundleIdentifier: "com.martijnmichel.directusexpo",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      versionCode: buildNumber,
      package: "com.martijnmichel.directusexpo",
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.RECORD_AUDIO",
      ],
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-image-picker",
        {
          photosPermission:
            "The app needs access to your photos to let you select images.",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: "66baa699-7004-4c6a-85ee-941ba6062451",
      },
    },
    runtimeVersion: {
      policy: "nativeVersion",
    },
    updates: {
      url: "https://u.expo.dev/66baa699-7004-4c6a-85ee-941ba6062451",
    },
  },
});
