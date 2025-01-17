const fs = require("fs");
const path = require("path");

const newVersion = process.argv[2];
if (!newVersion) {
  console.error("No version provided");
  process.exit(1);
}

const appJsonPath = path.join(__dirname, "..", "app.json");
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

appJson.expo.version = newVersion;
appJson.expo.buildNumber = newVersion.split(".").pop();

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
