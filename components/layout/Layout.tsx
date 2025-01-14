import React from "react";
import {
  View,
  ViewProps,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  ScrollViewProps,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { H1 } from "../display/typography";

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
    fontFamily: theme.typography.body.fontFamily,
  },
}));

interface KeyboardAwareLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  behavior?: "padding" | "height" | "position";
}

export function KeyboardAwareLayout({
  children,
  style,
  behavior = Platform.OS === "ios" ? "padding" : "height",
}: KeyboardAwareLayoutProps) {
  const { styles } = useStyles(stylesheet);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.layout, style]}
      enabled
    >
      {children}
    </KeyboardAvoidingView>
  );
}

export const KeyboardAwareScrollView = (props: ScrollViewProps) => (
  <ScrollView
    contentContainerStyle={{
      flexGrow: 1,
    }}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={true}
    automaticallyAdjustKeyboardInsets={true}
    {...props}
  />
);
