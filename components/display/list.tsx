import React from "react";
import { View, Pressable, ViewProps, StyleSheet } from "react-native";
import { Href, Link } from "expo-router";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Text } from "./typography";

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
  const itemStyle = StyleSheet.flatten([styles.item, style]);

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
      <Link href={href as Href} asChild>
        <Pressable style={itemStyle} {...props}>
          {renderContent()}
        </Pressable>
      </Link>
    );
  }

  return (
    <Pressable style={itemStyle} {...props} onPress={onPress}>
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
