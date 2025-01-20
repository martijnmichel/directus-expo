import React, { createContext, useContext, useState } from "react";
import {
  View,
  Pressable,
  ViewProps,
  Animated,
  LayoutAnimation,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { ChevronRight } from "@/components/icons/Chevron";
import { Text } from "./typography";
import { router } from "expo-router";

// Context
interface CollapsibleContextType {
  isOpen: boolean;
  toggle: () => void;
}

const CollapsibleContext = createContext<CollapsibleContextType | null>(null);

const useCollapsible = () => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error(
      "Collapsible components must be wrapped in <Collapsible />"
    );
  }
  return context;
};

// Root component
interface CollapsibleProps extends ViewProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: "default" | "group-detail";
}

export const Collapsible = ({
  children,
  defaultOpen = false,
  variant = "default",
  style,
  ...props
}: CollapsibleProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { styles } = useStyles(stylesheet);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  return (
    <CollapsibleContext.Provider value={{ isOpen, toggle }}>
      <View
        style={[
          styles.container,
          ["group-detail", "group-raw"].includes(variant) && styles.groupDetail,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </CollapsibleContext.Provider>
  );
};

// Trigger component
interface CollapsibleTriggerProps extends ViewProps {
  children: React.ReactNode;
  color?: string;
  prepend?: React.ReactNode;
  prependSize?: number;
  href?: string;
  variant?: "accordion" | "default";
}

export const CollapsibleTrigger = ({
  children,
  style,
  color,
  prepend,
  href,
  prependSize = 20,
  variant = "default",
  ...props
}: CollapsibleTriggerProps) => {
  const { isOpen, toggle } = useCollapsible();
  const { styles, theme } = useStyles(stylesheet);
  const spinValue = React.useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(spinValue, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  const triggerContent =
    typeof children === "string" ? (
      <Text style={styles.triggerText}>{children}</Text>
    ) : (
      children
    );

  const clonedPrepend = prepend
    ? React.cloneElement(prepend as React.ReactElement, {
        color: color || theme.colors.primary,
        size: prependSize,
      })
    : null;

  const Toggle = (
    <Pressable
      style={{ marginLeft: variant === "accordion" ? 0 : "auto" }}
      onPress={toggle}
    >
      <Animated.View style={{ transform: [{ rotate }] }} pointerEvents="none">
        <ChevronRight color={color || theme.colors.primary} size={24} />
      </Animated.View>
    </Pressable>
  );

  return (
    <Pressable
      onPress={() => {
        if (href) router.push(href as any);
        else toggle();
      }}
      style={[styles.trigger, style]}
      {...props}
    >
      {variant === "accordion" && Toggle}
      {clonedPrepend}
      {triggerContent}
      {variant === "default" && Toggle}
    </Pressable>
  );
};

// Content component
interface CollapsibleContentProps extends ViewProps {
  children: React.ReactNode;
}

export const CollapsibleContent = ({
  children,
  style,
  ...props
}: CollapsibleContentProps) => {
  const { isOpen } = useCollapsible();
  const { styles } = useStyles(stylesheet);

  if (!isOpen) return null;

  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
};

// Styles
const stylesheet = createStyleSheet((theme) => ({
  container: {
    overflow: "hidden",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.typography.body.fontFamily,
  },
  triggerText: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },
  content: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  groupDetail: {
    borderBottomWidth: theme.borderWidth.md,
    borderBottomColor: theme.colors.border,
  },
}));
