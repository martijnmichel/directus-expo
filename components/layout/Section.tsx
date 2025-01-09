import React from "react";
import { View, ViewProps } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface SectionProps extends ViewProps {
  children: React.ReactNode;
  centered?: boolean;
  spacing?: keyof typeof spacingMap;
}

// Map to theme spacing values
const spacingMap = {
  none: "none",
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
  xxl: "xxl",
} as const;

export const Section = ({
  children,
  centered = false,
  spacing = "lg",
  style,
  ...props
}: SectionProps) => {
  const { styles, theme } = useStyles(stylesheet);

  const verticalSpacing = spacing === "none" ? 0 : theme.spacing[spacing];

  return (
    <View
      style={[
        styles.section,
        centered && styles.centered,
        { paddingVertical: verticalSpacing },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const stylesheet = createStyleSheet((theme) => ({
  section: {
    width: "100%",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
}));
