const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const webAliases = {
  "react-native": "react-native-web",
  "react-native-webview": "@10play/react-native-web-webview",
  "react-native/Libraries/Utilities/codegenNativeComponent":
    "@10play/react-native-web-webview/shim",
  crypto: "expo-crypto",
};

config.resolver.resolveRequest = (
  context,
  realModuleName,
  platform,
  moduleName
) => {
  if (platform === "web") {
    const alias = webAliases[realModuleName];
    if (alias) {
      return {
        filePath: require.resolve(alias),
        type: "sourceFile",
      };
    }
  }
  return context.resolveRequest(context, realModuleName, platform, moduleName);
};

module.exports = config;
