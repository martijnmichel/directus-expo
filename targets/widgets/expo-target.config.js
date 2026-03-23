/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "widget",
  name: "widgets",
  displayName: "Directus Widgets",
  deploymentTarget: "18.0",
  bundleIdentifier: ".widgets",
  entitlements: {
    "com.apple.security.application-groups": [
      "group.com.martijnmichel.directusexpo.widgets",
    ],
  },
  colors: {
    $accent: "#6366f1",
  },
});
