import React from "react";
import { View, Pressable, ViewProps } from "react-native";
import { Link, RelativePathString } from "expo-router";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { ChevronRight } from "@/components/icons/Chevron";
import { Text } from "./typography";
import { MaterialIcons } from "@expo/vector-icons";
import { Database } from "../icons";

interface ListProps extends ViewProps {
  children: React.ReactNode;
}

export const List = ({ children, style, ...props }: ListProps) => {
  const { styles } = useStyles(stylesheet);

  return (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  );
};

interface ListItemProps extends ViewProps {
  children: React.ReactNode;
  href?: string;
  prepend?: React.ReactNode;
  prependSize?: number;
  color?: string;
  onPress?: () => void;
}

export const ListItem = ({
  children,
  href,
  onPress,
  style,
  prepend,
  prependSize = 20,
  color,
  ...props
}: ListItemProps) => {
  const { styles, theme } = useStyles(stylesheet);

  const content =
    typeof children === "string" ? (
      <Text style={[styles.text, color && { color }]}>{children}</Text>
    ) : (
      children
    );

  const clonedPrepend = prepend
    ? React.cloneElement(prepend as React.ReactElement, {
        color: color || theme.colors.primary,
        size: prependSize,
      })
    : null;

  const renderContent = () => (
    <>
      {clonedPrepend}
      {content}
    </>
  );

  if (href) {
    return (
      <Link href={href as RelativePathString}>
        <View style={[styles.item, style]} {...props}>
          {renderContent()}
        </View>
      </Link>
    );
  }

  return (
    <Pressable style={[styles.item, style]} {...props} onPress={onPress}>
      {renderContent()}
    </Pressable>
  );
};

const stylesheet = createStyleSheet((theme) => ({
  container: {
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.xs,
  },
  item: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: theme.spacing.sm,
    fontWeight: "500",
    fontFamily: theme.typography.body.fontFamily,
    gap: theme.spacing.md,
  },
  text: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },
}));
