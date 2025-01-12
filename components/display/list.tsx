import React from "react";
import { View, Pressable, ViewProps } from "react-native";
import { Link, RelativePathString } from "expo-router";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { ChevronRight } from "@/components/icons/Chevron";
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
}

export const ListItem = ({
  children,
  href,
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
      {href && (
        <View style={{ marginLeft: "auto" }}>
          <ChevronRight color={color || theme.colors.primary} size={20} />
        </View>
      )}
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
    <View style={[styles.item, style]} {...props}>
      {renderContent()}
    </View>
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
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  text: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: theme.typography.body.fontFamily,
    fontWeight: "500",
    color: theme.colors.textPrimary,
  },
}));
