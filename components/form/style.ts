import { createStyleSheet } from "react-native-unistyles";

export const formStyles = createStyleSheet((theme) => ({
  form: { display: "flex", flexDirection: "column", gap: theme.spacing.xl },
  formControl: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.label.fontSize,
    fontWeight: theme.typography.label.fontWeight,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    minHeight: 44,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  inputDisabled: {
    backgroundColor: theme.colors.backgroundAlt,
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
  },
  prepend: {
    padding: theme.spacing.md,
  },
  append: {
    padding: theme.spacing.md,
  },
  helperText: {
    fontSize: theme.typography.helper.fontSize,
    fontFamily: theme.typography.helper.fontFamily,
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
    height: 600,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    backgroundColor: theme.colors.background,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.sm,
  },
}));
