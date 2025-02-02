import React, { ReactNode } from "react";
import { View, TextInput, TextInputProps, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { InterfaceProps } from "./index";

type InputProps = InterfaceProps<TextInputProps>;

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    { label, error, prepend, append, helper, style, disabled, ...props },
    ref
  ) => {
    const { styles, theme } = useStyles(formStyles);

    // Default to error color if there's an error, otherwise use the theme's text color
    const defaultIconColor = error
      ? theme.colors.error
      : theme.colors.textSecondary;

    const finalIconColor = defaultIconColor;

    const clonedPrepend = prepend
      ? React.cloneElement(prepend as React.ReactElement, {
          color: finalIconColor,
          size: 20,
        })
      : null;

    const clonedAppend = append
      ? React.cloneElement(append as React.ReactElement, {
          color: finalIconColor,
          size: 20,
        })
      : null;

    return (
      <View style={styles.formControl}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputContainer,
            error && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
        >
          {prepend && <View style={styles.prepend}>{clonedPrepend}</View>}
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor="#A0A0A0"
            editable={!disabled}
            {...props}
          />
          {append && <View style={styles.append}>{clonedAppend}</View>}
        </View>
        {(error || helper) && (
          <Text style={[styles.helperText, error && styles.errorText]}>
            {error || helper}
          </Text>
        )}
      </View>
    );
  }
);
