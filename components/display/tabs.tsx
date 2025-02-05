import React, { createContext, useContext, useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  ViewStyle,
  StyleSheet,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Text } from "./typography";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// Context
interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
  variant?: "default" | "pills" | "underline";
}

const TabsContext = createContext<TabsContextType | null>(null);

const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be wrapped in <Tabs />");
  }
  return context;
};

// Root component
interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  variant?: "default" | "pills" | "underline";
  style?: ViewStyle;
}

export const Tabs = ({
  children,
  defaultValue,
  value,
  onChange,
  variant = "default",
  style,
}: TabsProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue || "");

  // Use controlled or uncontrolled state
  const activeTab = value !== undefined ? value : internalValue;

  const setActiveTab = (newValue: string) => {
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const { styles } = useStyles(tabsStyles);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, variant }}>
      <View style={[styles.container, style]}>{children}</View>
    </TabsContext.Provider>
  );
};

// List component
interface TabsListProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const TabsList = ({ children, style }: TabsListProps) => {
  const { styles } = useStyles(tabsStyles);
  const { variant = "default" } = useContext(TabsContext) || {};

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[
        styles.list,
        variant === "underline" && styles.listUnderline,
        style,
      ]}
      contentContainerStyle={styles.listContent}
    >
      {children}
    </ScrollView>
  );
};

// Trigger component
interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
  style?: ViewStyle;
}

const TabsTrigger = ({
  children,
  value,
  disabled,
  style,
}: TabsTriggerProps) => {
  const { activeTab, setActiveTab, variant = "default" } = useTabs();
  const { styles, theme } = useStyles(tabsStyles);
  const isActive = activeTab === value;

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      isActive
        ? variant === "pills"
          ? theme.colors.primary
          : "transparent"
        : "transparent",
      { duration: 200 }
    ),
  }));

  return (
    <Pressable
      onPress={() => !disabled && setActiveTab(value)}
      disabled={disabled}
      style={[
        styles.trigger,
        variant === "pills" && styles.triggerPills,
        variant === "underline" && styles.triggerUnderline,
        isActive && styles.triggerActive,
        isActive && variant === "underline" && styles.triggerUnderlineActive,
        disabled && styles.triggerDisabled,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.triggerBackground,
          variant === "pills" && styles.triggerBackgroundPills,
          animatedStyle,
        ]}
      />
      <Text
        style={[
          styles.triggerText,
          isActive && styles.triggerTextActive,
          isActive && variant === "pills" && styles.triggerTextPills,
          disabled && styles.triggerTextDisabled,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
};

// Content component
interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  style?: ViewStyle;
  forceMount?: boolean;
}

const TabsContent = ({
  children,
  value,
  style,
  forceMount,
}: TabsContentProps) => {
  const { activeTab } = useTabs();
  const { styles } = useStyles(tabsStyles);
  const isSelected = activeTab === value;

  // If forceMount is true, always render but handle visibility
  if (forceMount) {
    return (
      <Animated.View
        style={[
          styles.content,
          style,
          { display: isSelected ? "flex" : "none" },
        ]}
      >
        {children}
      </Animated.View>
    );
  }

  // Default behavior: only mount when active
  if (!isSelected) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.content, style]}
    >
      {children}
    </Animated.View>
  );
};

// Attach sub-components to Tabs
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

// Styles
const tabsStyles = createStyleSheet((theme) => ({
  container: {
    width: "100%",
  },
  list: {
    flexDirection: "row",
    marginBottom: theme.spacing.md,
  },
  listContent: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  trigger: {
    position: "relative",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    overflow: "hidden",
  },
  triggerBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  triggerActive: {
    backgroundColor: theme.colors.backgroundAlt,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerText: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
  },
  triggerTextActive: {
    color: theme.colors.primary,
  },
  triggerTextDisabled: {
    color: theme.colors.textTertiary,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
  },
  listUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  triggerPills: {
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  triggerUnderline: {
    borderRadius: 0,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: -1,
  },
  triggerUnderlineActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  triggerBackgroundPills: {
    borderRadius: theme.borderRadius.full,
  },
  triggerTextPills: {
    color: theme.colors.white,
  },
}));
