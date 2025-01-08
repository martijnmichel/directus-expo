import React from "react";
import { View, ViewProps } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface ContainerProps extends ViewProps {
  children: React.ReactNode;
  maxWidth?: keyof typeof containerSizes;
}

const containerSizes = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  full: "100%",
} as const;

export const Container = ({
  children,
  maxWidth = "lg",
  style,
  ...props
}: ContainerProps) => {
  const { styles } = useStyles(stylesheet);

  return (
    <View
      style={[styles.container, { maxWidth: containerSizes[maxWidth] }, style]}
      {...props}
    >
      {children}
    </View>
  );
};

const stylesheet = createStyleSheet((theme) => ({
  container: {
    width: "100%",
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    marginHorizontal: "auto",
  },
}));
