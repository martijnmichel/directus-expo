import React from "react";
import { View, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { RadioButton } from "./radio-button";
import { formStyles } from "./style";
import { InterfaceProps } from ".";

interface RadioOption {
  text: string;
  value: string | number;
}

type RadioButtonGroupProps = InterfaceProps<{
  options: RadioOption[];
  value: string | number;
  onChange: (value: string | number) => void;
}>;

export const RadioButtonGroup: React.FC<RadioButtonGroupProps> = ({
  label,
  error,
  helper,
  options,
  value,
  onChange,
  disabled,
}) => {
  const { styles } = useStyles(formStyles);
  const { styles: radioStyles } = useStyles(radioStylesheet);
  return (
    <View style={styles.formControl}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={radioStyles.optionsContainer}>
        {options.map((option) => (
          <View key={option.value} style={radioStyles.optionRow}>
            <RadioButton
              checked={value === option.value}
              onPress={() => !disabled && onChange(option.value)}
              label={option.text}
              size={20}
            />
          </View>
        ))}
      </View>
      {(error || helper) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
};

const radioStylesheet = createStyleSheet((theme) => ({
  optionsContainer: {
    gap: 12,
    flexDirection: {
      xs: "column",
      md: "row",
    },
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  optionLabel: {
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
}));
