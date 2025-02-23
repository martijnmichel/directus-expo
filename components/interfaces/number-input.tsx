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
import { InterfaceProps } from ".";

type NumberInputProps = InterfaceProps<
  TextInputProps & {
    min?: number;
    max?: number;
    step?: number;
    float?: boolean;
    decimal?: boolean;
  }
>;

export const NumberInput = React.forwardRef<TextInput, NumberInputProps>(
  (
    {
      label,
      error,
      helper,
      style,
      onChangeText,
      value = "",
      min,
      max,
      step = 1,
      float,
      decimal,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const { styles } = useStyles(formStyles);

    const formatNumber = (num: number) => {
      // Use toLocaleString for display, but keep precision
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 20, // High max to preserve precision
        useGrouping: false, // No thousand separators
      });
    };

    const parseLocaleNumber = (text: string) => {
      // Accept both . and , as decimal separators
      const normalized = text.replace(",", ".");
      return parseFloat(normalized);
    };

    const updateValue = (newValue: number) => {
      // Apply min/max constraints
      if (min !== undefined && newValue < min) newValue = min;
      if (max !== undefined && newValue > max) newValue = max;

      if (float || decimal) {
        const formatted = formatNumber(newValue);
        if (decimal) {
          // For decimal type, return as string
          onChangeText?.(formatted);
        } else {
          // For float type, return as number
          onChangeText?.(newValue.toString());
        }
      } else {
        // Integer
        onChangeText?.(Math.round(newValue).toString());
      }
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
      // Allow empty input and minus sign
      if (text === "" || text === "-") {
        onChangeText?.(text);
        return;
      }

      // Allow numbers, one decimal separator (. or ,) and minus sign at start
      if (!/^-?\d*[.,]?\d*$/.test(text)) {
        return;
      }

      // For non-decimal/float, don't allow decimal separators
      if (!float && !decimal && text.match(/[.,]/)) {
        return;
      }

      // For display, keep the comma
      const displayValue = text;

      // For onChange, convert comma to dot
      const normalizedValue = text.replace(",", ".");

      if (decimal || float) {
        if (float) {
          // For float, always use the normalized value (with dot)
          onChangeText?.(normalizedValue);
        } else {
          // For decimal display mode, keep the comma display
          onChangeText?.(displayValue);

          // Update display if needed
          if (text !== value) {
            setTimeout(() => {
              onChangeText?.(displayValue);
            }, 0);
          }
        }
      } else {
        // For integers, just pass the value
        onChangeText?.(text);
      }

      // Validate step if needed
      if (step && step !== 1) {
        const num = parseFloat(normalizedValue);
        if (!isNaN(num)) {
          const remainder = (num - (min || 0)) % step;
          if (Math.abs(remainder) < 0.00001) {
            updateValue(num);
          }
        }
      }
    };

    return (
      <View style={styles.formControl}>
        {label && (
          <Text style={styles.label}>
            {label} {required && "*"}
          </Text>
        )}
        <View
          style={[
            styles.inputContainer,
            error && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
        >
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
            onBlur={() => {
              if (max !== undefined && value !== "") {
                const currentValue = parseLocaleNumber(value);
                if (currentValue > max) {
                  updateValue(max);
                }
              }
            }}
            value={value}
            selectTextOnFocus
            returnKeyType="done"
            autoCapitalize="none"
            editable={!disabled}
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
