import React, { useEffect } from "react";
import { Pressable, View, Text, Animated } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  error?: string;
  helper?: string;
  disabled?: boolean;
  info?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  value,
  onValueChange,
  label,
  error,
  helper,
  disabled,
  info,
}) => {
  const { styles, theme } = useStyles(styleSheet);
  const translateX = new Animated.Value(value ? 20 : 0);

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 20 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  }, [value]);

  return (
    <View style={styles.formControl}>
      <View style={styles.headerContainer}>
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
      <Pressable
        style={{
          display: "flex",
          flexDirection: "row",
          gap: theme.spacing.md,
          alignItems: "center",
        }}
        onPress={() => !disabled && onValueChange(!value)}
      >
        <View
          style={[
            styles.toggleContainer,
            value && styles.toggleActive,
            error && styles.toggleError,
            disabled && styles.toggleDisabled,
          ]}
        >
          <Animated.View
            style={[
              styles.thumb,

              disabled && styles.thumbDisabled,
              { transform: [{ translateX }] },
            ]}
          />
        </View>

        {info && <Text style={styles.infoText}>{info}</Text>}
      </Pressable>

      {(error || helper) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
};

const styleSheet = createStyleSheet((theme) => ({
  formControl: {
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },
  toggleContainer: {
    width: 52,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundDark,
    padding: theme.spacing.xs,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleError: {
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.error,
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white,
  },
  thumbDisabled: {
    backgroundColor: theme.colors.textMuted,
  },
  helperText: {
    ...theme.typography.helper,
    color: theme.colors.textTertiary,
  },
  errorText: {
    color: theme.colors.error,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoText: {
    ...theme.typography.helper,
    color: theme.colors.textTertiary,
  },
}));
