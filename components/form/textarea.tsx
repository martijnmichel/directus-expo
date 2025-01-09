import React from "react";
import { View, TextInput, TextInputProps, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";

interface TextAreaProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  rows?: number;
}

export const TextArea = React.forwardRef<TextInput, TextAreaProps>(
  ({ label, error, helper, style, rows = 4, ...props }, ref) => {
    const { styles, theme } = useStyles(textAreaStyles);
    const { styles: formStyle } = useStyles(formStyles);

    // Calculate minimum height based on rows
    const minHeight = theme.typography.body.lineHeight * rows;

    return (
      <View style={formStyle.formControl}>
        {label && <Text style={formStyle.label}>{label}</Text>}
        <View style={[styles.textareaContainer, error && formStyle.inputError]}>
          <TextInput
            ref={ref}
            style={[styles.textarea, { minHeight }, style]}
            multiline
            textAlignVertical="top"
            placeholderTextColor={theme.colors.textTertiary}
            {...props}
          />
        </View>
        {(error || helper) && (
          <Text style={[formStyle.helperText, error && formStyle.errorText]}>
            {error || helper}
          </Text>
        )}
      </View>
    );
  }
);

const textAreaStyles = createStyleSheet((theme) => ({
  textareaContainer: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
  },
  textarea: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    padding: theme.spacing.lg,
  },
}));
