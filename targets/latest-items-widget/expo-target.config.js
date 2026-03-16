/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "widget",
  name: "latest-items-widget",
  displayName: "Latest Items",
  deploymentTarget: "15.0",
  bundleIdentifier: ".latest-items-widget",
  entitlements: {
    "com.apple.security.application-groups": [
      "group.com.martijnmichel.directusexpo.widgets",
    ],
  },
  colors: {
    $accent: "#6366f1",
  },
});
