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
}));
