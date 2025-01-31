import { View } from "react-native";
import { Horizontal } from "../layout/Stack";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { DirectusIcon } from "./directus-icon";
import { Text } from "./typography";

export type RelatedListItemProps = {
  append?: React.ReactNode;
  children: React.ReactNode;
  isNew?: boolean;
  isDeselected?: boolean;
  isDraggable?: boolean;
  prepend?: React.ReactNode;
};

export const RelatedListItem = ({
  append,
  children,
  isDraggable,
  isNew,
  isDeselected,
  prepend,
}: RelatedListItemProps) => {
  const { styles } = useStyles(listStyles);
  return (
    <Horizontal
      spacing="md"
      style={[
        styles.listItem,
        isDeselected && styles.listItemDeselected,
        isNew && styles.listItemNew,
      ]}
    >
      {isDraggable && <DirectusIcon name="drag_handle" />}
      {prepend}
      <Text
        numberOfLines={1}
        style={[
          styles.content,
          isDeselected && styles.listItemDeselectedText,
          isDraggable && { marginLeft: 12 },
          isNew && styles.listItemNew,
        ]}
      >
        {children}
      </Text>
      <Horizontal style={{ marginLeft: "auto", alignItems: "center" }}>
        {append}
      </Horizontal>
    </Horizontal>
  );
};

export const listStyles = createStyleSheet((theme) => ({
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
    paddingLeft: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border,
    height: 44,
    maxWidth: 500,
  },
  listItemDeselected: {
    borderColor: theme.colors.errorBorder,
    backgroundColor: theme.colors.errorBackground,
  },
  listItemDeselectedText: {},
  listItemNew: {
    borderColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,

    fontFamily: theme.typography.body.fontFamily,
  },
}));
