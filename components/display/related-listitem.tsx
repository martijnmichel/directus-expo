import { TouchableOpacity, View } from "react-native";
import { Horizontal } from "../layout/Stack";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { DirectusIcon } from "./directus-icon";
import { Text } from "./typography";
export type RelatedListItemProps = {
  append?: React.ReactNode;
  children: React.ReactNode;
  isNew?: boolean;
  isUpdated?: boolean;
  isDeselected?: boolean;
  isDraggable?: boolean;
  isPicked?: boolean;
  prepend?: React.ReactNode;
  onPress?: () => void;
};

export const RelatedListItem = ({
  append,
  children,
  isDraggable,
  isNew,
  isUpdated,
  isDeselected,
  prepend,
  isPicked,
  onPress,
}: RelatedListItemProps) => {
  const { styles, theme } = useStyles(listStyles);
  const isTextChild =
    typeof children === "string" || typeof children === "number";
  return (
    <Horizontal
      spacing="md"
      style={[
        styles.listItem,
        isDeselected && styles.listItemDeselected,
        (isNew || isPicked) && styles.listItemNew,
        isUpdated && styles.listItemUpdated,
      ]}
    >
      
      {isDraggable && <DirectusIcon name="drag_handle" />}
      {prepend && <View>{prepend}</View>}
      {isTextChild ? (
        <Text
          numberOfLines={1}
          style={[
            styles.content,
            isDeselected && styles.listItemDeselectedText,
            isNew && styles.listItemNew,
            children === "--" && { color: theme.colors.textMuted },
          ]}
        >
          {children}
        </Text>
      ) : (
        <View style={styles.partsContent}>{children}</View>
      )}
      <Horizontal
        style={{ marginLeft: "auto", alignItems: "center" }}
        spacing={0}
      >
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
    paddingLeft: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border,
    height: 44,
    maxWidth: 500,
  },
  listItemDeselected: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.errorBackground,
  },
  listItemDeselectedText: {},
  listItemNew: {
    borderColor: theme.colors.info,
    backgroundColor: theme.colors.infoBackground,
  },
  listItemUpdated: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryBackground,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,

    fontFamily: theme.typography.body.fontFamily,
  },

  partsContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    fontFamily: theme.typography.body.fontFamily,
  },
}));
