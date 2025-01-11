import React, { ReactNode } from "react";
import {
  View,
  TextInput,
  TextInputProps,
  Text,
  TouchableOpacity,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { Plus, Minus } from "../icons";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  min?: number;
  max?: number;
  step?: number;
  float?: boolean;
  decimal?: number;
}

export const NumberInput = React.forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helper,
      style,
      min,
      max,
      step = 1,
      float = false,
      decimal = 0,
      onChangeText,
      value = "",
      ...props
    },
    ref
  ) => {
    const { styles } = useStyles(formStyles);

    const updateValue = (newValue: number) => {
      // Apply min/max constraints
      if (min !== undefined && newValue < min) newValue = min;
      if (max !== undefined && newValue > max) newValue = max;

      // Apply decimal precision
      if (float && decimal !== undefined) {
        newValue = parseFloat(newValue.toFixed(decimal));
      }

      onChangeText?.(newValue.toString());
    };

    const handleIncrement = () => {
      const currentValue = float
        ? parseFloat(value || "0")
        : parseInt(value || "0");
      updateValue(currentValue + step);
    };

    const handleDecrement = () => {
      const currentValue = float
        ? parseFloat(value || "0")
        : parseInt(value || "0");
      updateValue(currentValue - step);
    };

    const handleChangeText = (text: string) => {
      // Remove non-numeric characters except decimal point if float is enabled
      let filtered = float
        ? text.replace(/[^\d.]/g, "")
        : text.replace(/\D/g, "");

      // Ensure only one decimal point
      if (float) {
        const parts = filtered.split(".");
        filtered = parts[0] + (parts.length > 1 ? "." + parts[1] : "");
      }

      // Convert to number for validation
      let num = float ? parseFloat(filtered || "0") : parseInt(filtered || "0");
      updateValue(num);
    };

    return (
      <View style={styles.formControl}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={[styles.inputContainer, error && styles.inputError]}>
          <TouchableOpacity
            style={styles.prepend}
            onPress={handleDecrement}
            disabled={min !== undefined && parseFloat(value || "0") <= min}
          >
            <Minus size={16} color="#666" />
          </TouchableOpacity>

          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor="#A0A0A0"
            keyboardType={float ? "decimal-pad" : "number-pad"}
            onChangeText={handleChangeText}
            value={value}
            {...props}
          />

          <TouchableOpacity
            style={styles.append}
            onPress={handleIncrement}
            disabled={max !== undefined && parseFloat(value || "0") >= max}
          >
            <Plus size={16} color="#666" />
          </TouchableOpacity>
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
