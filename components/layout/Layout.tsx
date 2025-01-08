import React from "react";
import { View, ViewProps, SafeAreaView } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface LayoutProps extends ViewProps {
  children: React.ReactNode;
  useSafeArea?: boolean;
}

export const Layout = ({
  children,
  useSafeArea = true,
  style,
  ...props
}: LayoutProps) => {
  const { styles } = useStyles(stylesheet);
  const Wrapper = useSafeArea ? SafeAreaView : View;

  return (
    <Wrapper style={[styles.layout, style]} {...props}>
      {children}
    </Wrapper>
  );
};

const stylesheet = createStyleSheet((theme) => ({
  layout: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}));
