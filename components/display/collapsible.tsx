import React, { createContext, useContext, useState } from "react";
import {
  View,
  Pressable,
  ViewProps,
  Animated,
  LayoutAnimation,
  Text,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { ChevronRight } from "@/components/icons/Chevron";

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
}

export const Collapsible = ({
  children,
  defaultOpen = false,
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
      <View style={[styles.container, style]} {...props}>
        {children}
      </View>
    </CollapsibleContext.Provider>
  );
};

// Trigger component
interface CollapsibleTriggerProps extends ViewProps {
  children: React.ReactNode;
}

export const CollapsibleTrigger = ({
  children,
  style,
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
      <Text style={{ fontWeight: "500" }}>{children}</Text>
    ) : (
      children
    );

  return (
    <Pressable onPress={toggle} style={[styles.trigger, style]} {...props}>
      {triggerContent}
      <Animated.View style={{ transform: [{ rotate }] }}>
        <ChevronRight color={theme.colors.primary} size={20} />
      </Animated.View>
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
    justifyContent: "space-between",
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
}));
