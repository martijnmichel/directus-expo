const stylesheet = createStyleSheet((theme) => ({
  filename: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: "500",
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  fileInfo: {
    fontSize: theme.typography.helper.fontSize,
    fontFamily: theme.typography.helper.fontFamily,
    color: theme.colors.textTertiary,
  },
}));
