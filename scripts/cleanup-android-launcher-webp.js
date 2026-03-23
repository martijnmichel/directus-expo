const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const resRoot = path.join(projectRoot, "android", "app", "src", "main", "res");

const densityFolders = [
  "mipmap-mdpi",
  "mipmap-hdpi",
  "mipmap-xhdpi",
  "mipmap-xxhdpi",
  "mipmap-xxxhdpi",
];

const iconNames = [
  "ic_launcher.webp",
  "ic_launcher_round.webp",
  "ic_launcher_foreground.webp",
];

let deleted = 0;

for (const folder of densityFolders) {
  for (const fileName of iconNames) {
    const fullPath = path.join(resRoot, folder, fileName);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      deleted += 1;
    }
  }
}

console.log(
  `cleanup-android-launcher-webp: deleted ${deleted} duplicate launcher webp file(s).`,
);
