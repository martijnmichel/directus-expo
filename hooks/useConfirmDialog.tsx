import { ConfirmDialog } from "@/components/display/confirm-dialog";
import React, { createContext, useCallback, useContext, useState } from "react";
import Animated, {
  FadeIn,
  FadeOut,
  withSequence,
  withSpring,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  isOpen: boolean;
  resolve?: (value: boolean) => void;
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<
  ConfirmDialogContextValue | undefined
>(undefined);

export function ConfirmDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dialog, setDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    description: "",
  });

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        ...options,
        isOpen: true,
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback(
    (result: boolean) => {
      dialog.resolve?.(result);
      setDialog((prev) => ({ ...prev, isOpen: false }));
    },
    [dialog]
  );

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      {dialog.isOpen && (
        <ConfirmDialog>
          <ConfirmDialog.Content
            title={dialog.title}
            description={dialog.description}
            confirmLabel={dialog.confirmLabel}
            cancelLabel={dialog.cancelLabel}
            variant={dialog.variant}
            onConfirm={() => handleClose(true)}
            onCancel={() => handleClose(false)}
          />
        </ConfirmDialog>
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error(
      "useConfirmDialog must be used within a ConfirmDialogProvider"
    );
  }
  return context.confirm;
}
