// Load .env so EXPO_PUBLIC_* and PUSH_SECRET are available (optional: install "dotenv" if using .env)
try {
  require("dotenv").config();
} catch {
  // dotenv not installed
}

const packageJson = require("./package.json");
const buildNumber = 8;

export default () => ({
  expo: {
    name: "Directus Mobile",
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
      entitlements: {
        "com.apple.security.application-groups": [
          "group.com.martijnmichel.directusexpo.widgets",
        ],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      versionCode: buildNumber,
      package: "com.martijnmichel.directusexpo.app",
      googleServicesFile: "./google-services.json",
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
      "@bacons/apple-targets",
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
            useLegacyPackaging: true,
          },
        },
      ],
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "expo-image-picker",
        {
          photosPermission:
            "The app needs access to your photos to let you select images.",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#ffffff",
          sounds: [],
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
      // Push: same value as PUSH_SECRET on the website. Set in .env as PUSH_SECRET or EXPO_PUBLIC_PUSH_SECRET, or in EAS Secrets.
      pushSecret:
        process.env.PUSH_SECRET ?? process.env.EXPO_PUBLIC_PUSH_SECRET ?? "",
    },
    runtimeVersion: `${buildNumber}`,
    updates: {
      url: "https://u.expo.dev/66baa699-7004-4c6a-85ee-941ba6062451",
    },
  },
});
