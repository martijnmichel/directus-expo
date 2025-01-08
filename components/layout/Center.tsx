import React from "react";
import { View, ViewProps } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface CenterProps extends ViewProps {
  children: React.ReactNode;
}

export const Center = ({ children, style, ...props }: CenterProps) => {
  const { styles } = useStyles(stylesheet);

  return (
    <View style={[styles.center, style]} {...props}>
      {children}
    </View>
  );
};

const stylesheet = createStyleSheet({
  center: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
});
