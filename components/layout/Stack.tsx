import React from "react";
import { View, ViewProps } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface StackProps extends ViewProps {
  children: React.ReactNode;
  spacing?: number;
  reverse?: boolean;
}

export const VStack = ({
  children,
  spacing,
  reverse = false,
  style,
  ...props
}: StackProps) => {
  const { styles, theme } = useStyles(stylesheet);
  const gap = spacing ?? theme.spacing.md;

  return (
    <View
      style={[styles.vstack, { gap }, reverse && styles.reverse, style]}
      {...props}
    >
      {children}
    </View>
  );
};

export const HStack = ({
  children,
  spacing,
  reverse = false,
  style,
  ...props
}: StackProps) => {
  const { styles, theme } = useStyles(stylesheet);
  const gap = spacing ?? theme.spacing.md;

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
