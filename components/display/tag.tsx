import { ReactNode } from "react";
import { Pressable, PressableProps, Text, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

export const Tag = ({
  children,
  isSelected,
  ...props
}: PressableProps & { children: ReactNode; isSelected?: boolean }) => {
  const { styles, theme } = useStyles(badgeStyles);
  return (
    <Pressable style={[styles.badge, isSelected && styles.selected]} {...props}>
      <Text style={[styles.text, isSelected && styles.selectedText]}>
        {children}
      </Text>
    </Pressable>
  );
};
const badgeStyles = createStyleSheet((theme) => ({
  badge: {
    backgroundColor: theme.colors.backgroundDark,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  text: {
    color: theme.colors.textSecondary,
  },
  selected: {
    backgroundColor: theme.colors.primary,
  },
  selectedText: {
    color: "white",
  },
}));
