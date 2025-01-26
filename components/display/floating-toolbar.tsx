import { createStyleSheet, useStyles } from "react-native-unistyles";
import React from "react";
import Animated, { SlideInDown, SlideInUp } from "react-native-reanimated";
import { PortalHost } from "../layout/Portal";
import { useTranslation } from "react-i18next";
import { Horizontal } from "../layout/Stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function FloatingToolbar({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { styles } = useStyles(stylesheet);
  const { bottom } = useSafeAreaInsets();

  return (
    <Animated.View
      entering={SlideInDown}
      style={[styles.toolbar, { marginBottom: bottom + 44 }]}
    >
      <Horizontal>{children}</Horizontal>
    </Animated.View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  toolbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
}));
export const ftStyles = stylesheet;
