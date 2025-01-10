import React from "react";
import { View, ViewProps } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface StackProps extends ViewProps {
  children: React.ReactNode;
  spacing?: number | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  reverse?: boolean;
}

export const Vertical = ({
  children,
  spacing,
  reverse = false,
  style,
  ...props
}: StackProps) => {
  const { styles, theme } = useStyles(stylesheet);
  const gap =
    typeof spacing === "number" ? spacing : theme.spacing[spacing ?? "md"];

  return (
    <View
      style={[styles.vstack, { gap }, reverse && styles.reverse, style]}
      {...props}
    >
      {children}
    </View>
  );
};

export const Horizontal = ({
  children,
  spacing,
  reverse = false,
  style,
  ...props
}: StackProps) => {
  const { styles, theme } = useStyles(stylesheet);
  const gap =
    typeof spacing === "number" ? spacing : theme.spacing[spacing ?? "md"];

  return (
    <View
      style={[styles.hstack, { gap }, reverse && styles.reverse, style]}
      {...props}
    >
      {children}
    </View>
  );
};

const stylesheet = createStyleSheet({
  vstack: {
    flexDirection: "column",
  },
  hstack: {
    flexDirection: "row",
    alignItems: "center",
  },
  reverse: {
    flexDirection: "row-reverse",
  },
});
