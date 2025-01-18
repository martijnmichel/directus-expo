import Toast, { ToastShowParams } from "react-native-toast-message";
import { lightTheme } from "@/unistyles/theme";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastConfig {
  message: string;
  description?: string;
  duration?: number;
  position?: "top" | "bottom";
  onPress?: () => void;
}

class ToastManager {
  private static getTypeConfig(type: ToastType): Partial<ToastShowParams> {
    const configs = {
      success: {
        type: "success",
        visibilityTime: 3000,
        backgroundColor: lightTheme.colors.success,
        textColor: lightTheme.colors.white,
      },
      error: {
        type: "error",
        visibilityTime: 4000,
        backgroundColor: lightTheme.colors.error,
        textColor: lightTheme.colors.white,
      },
      warning: {
        type: "warning",
        visibilityTime: 4000,
        backgroundColor: lightTheme.colors.warning,
        textColor: lightTheme.colors.textPrimary,
      },
      info: {
        type: "info",
        visibilityTime: 3000,
        backgroundColor: lightTheme.colors.primary,
        textColor: lightTheme.colors.white,
      },
    };

    return configs[type];
  }

  static show(type: ToastType, config: ToastConfig) {
    const typeConfig = this.getTypeConfig(type);

    Toast.show({
      ...typeConfig,
      text1: config.message,
      text2: config.description,
      position: config.position || "top",
      onPress: config.onPress,
      visibilityTime: config.duration || typeConfig.visibilityTime,
    });
  }

  static success(config: ToastConfig) {
    this.show("success", config);
  }

  static error(config: ToastConfig) {
    this.show("error", config);
  }

  static warning(config: ToastConfig) {
    this.show("warning", config);
  }

  static info(config: ToastConfig) {
    this.show("info", config);
  }

  static hide() {
    Toast.hide();
  }
}

export default ToastManager;
