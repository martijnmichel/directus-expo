import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

export function Divider() {
  const { styles } = useStyles(stylesheet);
  return <View style={styles.divider} />;
}

const stylesheet = createStyleSheet((theme) => ({
  divider: {
    backgroundColor: theme.colors.border,
    height: theme.borderWidth.md,
    marginVertical: theme.spacing.sm,
  },
}));
