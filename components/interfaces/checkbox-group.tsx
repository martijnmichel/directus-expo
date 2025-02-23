import React from "react";
import { View, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { Checkbox } from "./checkbox";
import { InterfaceProps } from ".";

interface Option {
  text: string;
  value: string | number;
}

type CheckboxGroupProps = InterfaceProps<{
  options: Option[];
  value?: (string | number)[] | undefined;
  onChange?: (value: (string | number)[]) => void;
}>;

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  error,
  helper,
  options,
  value = [],
  onChange,
  disabled,
  required,
}) => {
  const { styles } = useStyles(formStyles);

  const handleCheckboxChange = (optionValue: string | number) => {
    if (!onChange) return;

    const newValue = value?.includes(optionValue)
      ? value?.filter((v) => v !== optionValue)
      : [...(value || []), optionValue];

    onChange(newValue);
  };

  return (
    <View style={styles.formControl}>
      {label && (
        <Text style={styles.label}>
          {label} {required && "*"}
        </Text>
      )}
      <View style={styles.checkboxGroup}>
        {options.map((option) => (
          <View key={option.value} style={styles.checkboxItem}>
            <Checkbox
              checked={value?.includes(option.value)}
              onChange={() => handleCheckboxChange(option.value)}
              disabled={disabled}
              text={option.text}
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
