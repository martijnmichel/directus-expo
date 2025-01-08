import React, { ReactNode } from "react";
import { View, TextInput, TextInputProps, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  prepend?: ReactNode;
  append?: ReactNode;
  helper?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, prepend, append, helper, style, ...props }, ref) => {
    const { styles } = useStyles(formStyles);

    return (
      <View style={styles.formControl}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={[styles.inputContainer, error && styles.inputError]}>
          {prepend && <View style={styles.prepend}>{prepend}</View>}
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor="#A0A0A0"
            {...props}
          />
          {append && <View style={styles.append}>{append}</View>}
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
