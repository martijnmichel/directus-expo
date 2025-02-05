import { TouchableOpacity, View } from "react-native";
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
  onPress?: () => void;
};

export const RelatedListItem = ({
  append,
  children,
  isDraggable,
  isNew,
  isDeselected,
  prepend,
  onPress,
}: RelatedListItemProps) => {
  const { styles, theme } = useStyles(listStyles);
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress}>
      <Horizontal
        spacing="md"
        style={[
          styles.listItem,
          isDeselected && styles.listItemDeselected,
          isNew && styles.listItemNew,
        ]}
      >
        {isDraggable && <DirectusIcon name="drag_handle" />}
        {prepend && <View>{prepend}</View>}
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
        <Horizontal
          style={{ marginLeft: "auto", alignItems: "center" }}
          spacing={0}
        >
          {append}
        </Horizontal>
      </Horizontal>
    </Wrapper>
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
