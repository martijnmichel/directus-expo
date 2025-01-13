import { useStyles } from "react-native-unistyles";

export const useHeaderStyles = () => {
  const { theme } = useStyles();
  return {
    headerShadowVisible: false,
    contentStyle: {
      paddingTop: 10, // This will add space below the header
      backgroundColor: theme.colors.background,
    },
  };
};
