import React from "react";
import { View, TextInput, TextInputProps, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { InterfaceProps } from ".";

type TextAreaInterfaceProps = InterfaceProps<
  TextInputProps & { rows?: number }
>;

export const TextArea = React.forwardRef<TextInput, TextAreaInterfaceProps>(
  ({ label, error, helper, rows = 4, disabled, required, ...props }, ref) => {
    const { styles, theme } = useStyles(textAreaStyles);
    const { styles: formStyle } = useStyles(formStyles);

    // Calculate minimum height based on rows
    const minHeight = theme.typography.body.lineHeight * rows;

    return (
      <View style={formStyle.formControl}>
        {label && (
          <Text style={formStyle.label}>
            {label} {required && "*"}
          </Text>
        )}
        <View
          style={[
            styles.textareaContainer,
            error && formStyle.inputError,
            disabled && formStyle.inputDisabled,
          ]}
        >
          <TextInput
            ref={ref}
            style={[styles.textarea, { minHeight }]}
            multiline
            textAlignVertical="top"
            placeholderTextColor={theme.colors.textTertiary}
            editable={!disabled}
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
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
  },
  textarea: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    padding: theme.spacing.lg,
  },
}));
