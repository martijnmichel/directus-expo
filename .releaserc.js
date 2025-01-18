module.exports = {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "CHANGELOG.md"],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    [
      "@semantic-release/exec",
      {
        prepareCmd:
          // Update package.json version
          "npm version ${nextRelease.version} --no-git-tag-version --allow-same-version && " +
          // Update app version
          "node scripts/update-app-version.js ${nextRelease.version}",
      },
    ],
  ],
};
