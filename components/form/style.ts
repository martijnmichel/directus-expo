import { createStyleSheet } from "react-native-unistyles";

export const formStyles = createStyleSheet((theme) => ({
  form: { display: "flex", flexDirection: "column", gap: theme.spacing.md },
  formControl: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.label.fontSize,
    fontWeight: theme.typography.label.fontWeight,
    color: theme.colors.textPrimary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    minHeight: 44,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    padding: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
  },
  prepend: {
    paddingLeft: theme.spacing.md,
  },
  append: {
    paddingRight: theme.spacing.md,
  },
  helperText: {
    fontSize: theme.typography.helper.fontSize,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.error,
  },
  // Rich text editor specific styles
  richTextContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden", // Ensures toolbar corners match container
  },
  richTextToolbar: {
    backgroundColor: theme.colors.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    padding: theme.spacing.xs,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  richTextToolbarButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: "transparent",
  },
  richTextToolbarButtonActive: {
    backgroundColor: theme.colors.background,
  },
  richTextToolbarButtonIcon: {
    color: theme.colors.textSecondary,
  },
  richTextToolbarButtonIconActive: {
    color: theme.colors.primary,
  },
  richTextEditor: {
    flex: 1,
    minHeight: 300,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    backgroundColor: theme.colors.background,
  },
}));
