import { createStyleSheet, useStyles } from "react-native-unistyles";
import React from "react";
import Animated, { SlideInDown, SlideInUp } from "react-native-reanimated";
import { PortalHost } from "../layout/Portal";

export function FloatingToolbar() {
  const { styles } = useStyles(stylesheet);

  return (
    <Animated.View entering={SlideInDown} style={[styles.toolbar]}>
      <PortalHost name="floating-toolbar" />
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
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md,
  },
}));
