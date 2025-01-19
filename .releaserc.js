module.exports = {
  branches: ["main"],
  tagFormat: "v${version}",
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { type: "feat", release: "patch" },
          { type: "fix", release: "patch" },
          { type: "perf", release: "minor" },
          { type: "refactor", release: "minor" },
          { type: "style", release: "minor" },
          { type: "docs", release: "minor" },
          { type: "chore", release: "path" },
          { scope: "no-release", release: false },
        ],
        parserOpts: {
          noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"],
        },
      },
    ],
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
      },
    ],
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
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
        prepareCmd: "node scripts/update-app-version.js ${nextRelease.version}",
      },
    ],
  ],
  dryRun: false,
  ci: false,
};
