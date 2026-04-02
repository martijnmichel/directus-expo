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
    height: 44,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  inputDisabled: {
    backgroundColor: theme.colors.backgroundAlt,
  },
  input: {
    flex: 1,
    height: "100%",
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    paddingHorizontal: theme.spacing.md,
  },
  prepend: {
    padding: theme.spacing.md,
  },
  append: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
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
    borderWidth: theme.borderWidth.md,
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
  checkboxGroup: {
    marginTop: 4,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  /** Row for single Checkbox: box + caption (replaces ad-hoc Pressable styles). */
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  /** Inline label next to the checkbox (same weight as field labels). */
  checkboxCaption: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.label.fontSize,
    fontWeight: theme.typography.label.fontWeight,
    fontFamily: theme.typography.label.fontFamily,
  },
  checkboxLabel: {
    marginLeft: 8,
    color: theme.colors.textPrimary,
  },
  /** Grouped block (e.g. widget slot editor) — matches alert/input surface tokens. */
  slotCard: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    padding: 0,
    margin: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border,
  },
}));
