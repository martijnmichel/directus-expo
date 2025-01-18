import React from "react";
import { View, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";
import {
  DirectusIcon,
  DirectusIconName,
  MaterialIconName,
} from "./directus-icon";

type AlertStatus = "success" | "error" | "warning" | "info";

interface AlertProps {
  status?: AlertStatus;
  message: string;
}

const getStatusConfig = (status: AlertStatus) => {
  switch (status) {
    case "success":
      return { color: "success", icon: "msCheckCircle" as MaterialIconName };
    case "error":
      return { color: "error", icon: "msError" as MaterialIconName };
    case "warning":
      return { color: "warning", icon: "msWarning" as MaterialIconName };
    case "info":
    default:
      return {
        color: "primary",
        icon: "msInfo" as MaterialIconName,
      };
  }
};

export const Alert: React.FC<AlertProps> = ({ status = "info", message }) => {
  const { styles, theme } = useStyles(stylesheet);
  const statusConfig = getStatusConfig(status);
  const statusColor =
    theme.colors[statusConfig.color as keyof typeof theme.colors];

  return (
    <View style={styles.container}>
      <DirectusIcon name={statusConfig.icon} size={20} color={statusColor} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  icon: {
    width: 20,
    height: 20,
  },
  message: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
}));
