import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import { cloneElement, isValidElement } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "soft";
type ButtonSize = "sm" | "md" | "lg";

interface IconProps {
  color?: string;
  size?: number;
}

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactElement<IconProps>;
  rightIcon?: React.ReactElement<IconProps>;
  fullWidth?: boolean;
  rounded?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<any, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      rounded = false,
      disabled,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();
    const { styles, theme } = useStyles(stylesheet);

    const getContainerStyles = () => [
      styles.base,
      styles[variant],
      styles[size],
      rounded && styles.rounded,
      fullWidth && styles.fullWidth,
      disabled && styles.disabled,
      style,
    ];

    const getTextStyles = () => [
      styles.text,
      styles[`${variant}Text`],
      styles[`${size}Text`],
      disabled && styles.mutedText,
    ];

    const getIconColor = () => {
      if (disabled) return theme.colors.textMuted;
      switch (variant) {
        case "primary":
          return theme.colors.white;
        case "secondary":
          return theme.colors.textPrimary;
        default:
          return theme.colors.primary;
      }
    };

    const renderContent = () => {
      if (loading) {
        return (
          <ActivityIndicator
            color={
              variant === "primary" ? theme.colors.white : theme.colors.primary
            }
            style={styles.spinner}
          />
        );
      }

      const iconColor = getIconColor();
      const iconSize = size === "sm" ? 16 : size === "lg" ? 24 : 20;

      return (
        <View style={styles.content}>
          {leftIcon && (
            <View style={styles.leftIcon}>
              {isValidElement(leftIcon)
                ? cloneElement(leftIcon, { color: iconColor, size: iconSize })
                : leftIcon}
            </View>
          )}
          {typeof children === "string" ? (
            <Text style={getTextStyles()}>{children}</Text>
          ) : isValidElement<IconProps>(children) ? (
            cloneElement(children, { color: iconColor, size: iconSize })
          ) : (
            children
          )}
          {rightIcon && (
            <View style={styles.rightIcon}>
              {isValidElement(rightIcon)
                ? cloneElement(rightIcon, { color: iconColor, size: iconSize })
                : rightIcon}
            </View>
          )}
        </View>
      );
    };

    return (
      <TouchableOpacity
        ref={ref}
        style={getContainerStyles()}
        disabled={disabled || loading}
        {...props}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }
);

const stylesheet = createStyleSheet((theme) => ({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.md,
    borderColor: "transparent",
    height: 44,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  // Variants
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  soft: {
    backgroundColor: theme.colors.backgroundAlt,
  },

  secondary: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  // Sizes
  sm: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    minHeight: 32,
    minWidth: 32,
  },
  md: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 40,
    minWidth: 40,
  },
  lg: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 48,
    minWidth: 48,
  },

  // Text styles
  text: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textPrimary,
  },
  primaryText: {
    color: theme.colors.white,
  },
  softText: {
    color: theme.colors.white,
  },
  secondaryText: {
    color: theme.colors.textPrimary,
  },
  mutedText: {
    color: theme.colors.textMuted,
  },
  outlineText: {
    color: theme.colors.textPrimary,
  },
  ghostText: {
    color: theme.colors.textSecondary,
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
  // States
  disabled: {
    backgroundColor: theme.colors.backgroundAlt,
    borderWidth: 0,
    color: theme.colors.textMuted,
  },
  // Layout
  fullWidth: {
    width: "100%",
  },
  // Icons
  leftIcon: {
    marginRight: theme.spacing.xs,
  },
  rightIcon: {
    marginLeft: theme.spacing.xs,
  },
  spinner: {
    marginHorizontal: theme.spacing.xs,
  },
  // New rounded style
  rounded: {
    borderRadius: 9999,
    paddingHorizontal: 0,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
}));
