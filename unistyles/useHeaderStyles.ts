import { useTheme } from "@react-navigation/native";
import { UnistylesRuntime, useStyles } from "react-native-unistyles";

export const useHeaderStyles = (
  props: { isModal?: boolean } = { isModal: false }
) => {
  const { theme } = useStyles();
  return {
    headerShadowVisible: false,
    headerTitleStyle: {
      color: theme.colors.textPrimary,
    },
    headerStyle: {
      backgroundColor: props.isModal
        ? theme.colors.backgroundAlt
        : theme.colors.background,
    },
    contentStyle: {
      paddingTop: 14, // This will add space below the header
      backgroundColor: theme.colors.background,
    },
    // Do not set tabBar* here: nested Stack screens spread these options and
    // they bubble to the parent Tabs, overriding tabBarIcon / tab bar colors.
  };
};
