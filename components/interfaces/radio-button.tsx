import React from "react";
import { Pressable, View, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface RadioButtonProps {
  checked: boolean;
  onPress: () => void;
  size?: number;
  label?: string;
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  checked,
  onPress,
  size = 20,
  label,
}) => {
  const { styles, theme } = useStyles(stylesheet);

  return (
    <Pressable onPress={onPress} style={[styles.wrapper]}>
      <View
        style={[
          styles.container,
          { width: size, height: size },
          checked && styles.containerChecked,
        ]}
      >
        {checked && (
          <View
            style={[styles.dot, { width: size * 0.5, height: size * 0.5 }]}
          />
        )}
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
};

const stylesheet = createStyleSheet((theme) => ({
  container: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 999,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  containerChecked: {
    backgroundColor: theme.colors.primary,
  },
  dot: {
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 13,
  },
}));
