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

type ButtonVariant = "ghost" | "soft" | "fill";
type ButtonColorScheme = "primary" | "error" | "info" | "success" | "warning";
type ButtonSize = "sm" | "md" | "lg";

interface IconProps {
  color?: string;
  size?: number;
}

export interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  colorScheme?: ButtonColorScheme;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactElement<IconProps>;
  rightIcon?: React.ReactElement<IconProps>;
  fullWidth?: boolean;
  rounded?: boolean;
  children: React.ReactNode;
  floating?: boolean;
}

export const Button = React.forwardRef<any, ButtonProps>(
  (
    {
      variant = "fill",
      colorScheme = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      rounded = false,
      disabled,
      style,
      children,
      floating = false,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();
    const { styles, theme } = useStyles(stylesheet);

    const getContainerStyles = () => [
      styles.base,
      styles[variant],
      styles[`${variant}_${colorScheme}`],
      styles[size],
      rounded && styles.rounded,
      fullWidth && styles.fullWidth,
      disabled && styles.disabled,
      floating && styles.floating,
      style,
    ];

    const getTextStyles = () => [
      styles.text,
      styles[`${variant}_${colorScheme}Text`],
      styles[`${size}Text`],
      disabled && styles.text,
    ];

    const getIconColor = () => {
      if (disabled) return theme.colors.textMuted;
      switch (variant) {
        case "soft":
          return theme.colors[colorScheme];
        case "ghost":
          return theme.colors[colorScheme];
        case "fill":
          return colorScheme === "primary" ? "white" : theme.colors.background;
        default:
          return "white";
      }
    };

    const renderContent = () => {
      if (loading) {
        return (
          <ActivityIndicator color={getIconColor()} style={styles.spinner} />
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
  // Variants with color schemes
  fill: {
    borderWidth: 0,
  },
  fill_primary: {
    backgroundColor: theme.colors.primary,
  },
  fill_error: {
    backgroundColor: theme.colors.error,
  },
  fill_success: {
    backgroundColor: theme.colors.success,
  },
  fill_warning: {
    backgroundColor: theme.colors.warning,
  },
  fill_info: {
    backgroundColor: theme.colors.info,
  },

  soft: {
    borderWidth: 0,
  },
  soft_primary: {
    backgroundColor: theme.colors.backgroundAlt,
  },
  soft_error: {
    backgroundColor: theme.colors.errorBackground,
  },
  soft_success: {
    backgroundColor: theme.colors.successBackground,
  },
  soft_warning: {
    backgroundColor: theme.colors.warningBackground,
  },
  soft_info: {
    backgroundColor: theme.colors.infoBackground,
  },

  ghost: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  ghost_primary: {},
  ghost_error: {},
  ghost_success: {},
  ghost_warning: {},
  ghost_info: {},

  // Text styles for variants
  fill_primaryText: {
    color: "white",
  },
  fill_errorText: {
    color: theme.colors.background,
  },
  fill_successText: {
    color: theme.colors.background,
  },
  fill_warningText: {
    color: theme.colors.background,
  },
  fill_infoText: {
    color: theme.colors.background,
  },

  soft_primaryText: {
    color: theme.colors.primary,
  },
  soft_errorText: {
    color: theme.colors.error,
  },
  soft_successText: {
    color: theme.colors.success,
  },
  soft_warningText: {
    color: theme.colors.warning,
  },
  soft_infoText: {
    color: theme.colors.info,
  },

  ghost_primaryText: {
    color: theme.colors.primary,
  },
  ghost_errorText: {
    color: theme.colors.error,
  },
  ghost_successText: {
    color: theme.colors.success,
  },
  ghost_warningText: {
    color: theme.colors.warning,
  },
  ghost_infoText: {
    color: theme.colors.info,
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
    minHeight: 44,
    minWidth: 48,
  },

  // Text styles
  text: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textPrimary,
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
  floating: {
    shadowColor: theme.colors.backgroundInvert,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6, // for Android
  },
}));
