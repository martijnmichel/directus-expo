import { createStyleSheet, useStyles } from "react-native-unistyles";
import React from "react";
import Animated, { SlideInDown, SlideInUp } from "react-native-reanimated";
import { PortalHost } from "../layout/Portal";
import { useTranslation } from "react-i18next";
import { Horizontal } from "../layout/Stack";

export function FloatingToolbar() {
  const { t } = useTranslation();
  const { styles } = useStyles(stylesheet);

  return (
    <Animated.View entering={SlideInDown} style={[styles.toolbar]}>
      <Horizontal>
        <PortalHost name="floating-toolbar" />
      </Horizontal>
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
    padding: theme.spacing.md,
  },
}));
export const ftStyles = stylesheet;
