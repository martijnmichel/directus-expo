import React from "react";
import { View, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import { InterfaceProps } from ".";
import { Button } from "@/components/display/button";

interface Option {
  text?: string;
  icon?: React.ReactElement<{ color?: string; size?: number }>;
  value: string | number;
}

type ButtonGroupProps = InterfaceProps<{
  options: Option[];
  value?: (string | number)[];
  onChange?: (value: (string | number)[]) => void;
}>;

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
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
  const { styles: groupStyles } = useStyles(stylesheet);

  const toggle = (optionValue: string | number) => {
    if (!onChange || disabled) return;
    const next = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(next);
  };

  return (
    <View style={styles.formControl}>
      {label && (
        <Text style={styles.label}>
          {label} {required && "*"}
        </Text>
      )}
      <View style={groupStyles.outlinedContainer}>
        {options.map((option, index) => {
          const selected = value.includes(option.value);
          const label = option.text ?? option.value;
          return (
            <View key={option.value} style={groupStyles.optionWrapper}>
              {index > 0 ? <View style={groupStyles.divider} /> : null}
              <Button
                variant={selected ? "fill" : "ghost"}
                colorScheme="primary"
                onPress={() => toggle(option.value)}
                disabled={disabled}
                leftIcon={option.text ? option.icon : undefined}
                style={groupStyles.button}
              >
                {option.icon && !option.text ? option.icon : label}
              </Button>
            </View>
          );
        })}
      </View>
      {(error || helper) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
};

const stylesheet = createStyleSheet((theme) => ({
  outlinedContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.background,
  },
  optionWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
  },
  button: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 0,
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.border,
    alignSelf: "stretch",
  },
}));
