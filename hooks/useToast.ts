import Toast from "react-native-toast-message";

type ToastType = "success" | "error" | "info";

interface ToastOptions {
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
}

export const useToast = () => {
  const showToast = ({
    message,
    title,
    type = "info",
    duration = 3000,
  }: ToastOptions) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      visibilityTime: duration,
      position: "bottom",
      autoHide: true,
    });
  };

  return {
    show: showToast,
    success: (message: string, title?: string) =>
      showToast({ message, title, type: "success" }),
    error: (message: string, title?: string) =>
      showToast({ message, title, type: "error" }),
    info: (message: string, title?: string) =>
      showToast({ message, title, type: "info" }),
  };
};
