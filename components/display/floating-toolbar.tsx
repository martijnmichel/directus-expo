import { createStyleSheet, useStyles } from "react-native-unistyles";
import React from "react";
import Animated, { SlideInDown, SlideInUp } from "react-native-reanimated";
import { PortalHost } from "../layout/Portal";
import { useTranslation } from "react-i18next";
import { Horizontal } from "../layout/Stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";

export function FloatingToolbar({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { styles } = useStyles(stylesheet);
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={[styles.toolbar]}>
      <Horizontal>{children}</Horizontal>
    </View>
  );
}

export function FloatingToolbarHost() {
  const { t } = useTranslation();
  const { styles } = useStyles(stylesheet);
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={[styles.toolbar]}>
      <Horizontal>
        <PortalHost name="floating-toolbar" />
      </Horizontal>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  toolbar: {
    position: "absolute",
    bottom: theme.spacing.lg,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
  },
}));
export const ftStyles = stylesheet;
