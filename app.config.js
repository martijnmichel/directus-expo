const packageJson = require("./package.json");
const buildNumber = 6;

export default () => ({
  expo: {
    name: "directus-expo",
    slug: "directus-expo",
    version: packageJson.version,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "directus",
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
      associatedDomains: ["applinks:directusmobile.app"],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      versionCode: buildNumber,
      package: "com.martijnmichel.directusexpo.app",
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
    runtimeVersion: `${buildNumber}`,
    updates: {
      url: "https://u.expo.dev/66baa699-7004-4c6a-85ee-941ba6062451",
    },
    plugins: [
      "expo-web-browser"
    ]
  },
  
});
