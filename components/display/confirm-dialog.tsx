import React, {
  createContext,
  useContext,
  useState,
  cloneElement,
} from "react";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Button } from "./button";
import Animated, {
  FadeIn,
  FadeOut,
  withSequence,
  withSpring,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import {
  Modal as RNModal,
  Pressable,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { H2, Text } from "./typography";

interface ConfirmDialogContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

interface ConfirmDialogProps {
  children: React.ReactNode;
}

interface ConfirmDialogContentProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: "danger" | "default";
  contentStyle?: ViewStyle;
}

interface ConfirmDialogTriggerProps {
  children: React.ReactElement;
}

export const ConfirmDialog = ({ children }: ConfirmDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <ConfirmDialogContext.Provider value={{ isOpen, open, close }}>
      {children}
    </ConfirmDialogContext.Provider>
  );
};

const ConfirmDialogContent = ({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  contentStyle,
}: ConfirmDialogContentProps) => {
  const { styles } = useStyles(confirmDialogStyles);
  const { isOpen, close } = useContext(ConfirmDialogContext);
  const shakeX = useSharedValue(0);

  const handleOverlayPress = () => {
    shakeX.value = withSequence(
      withSpring(-6, { mass: 0.2, stiffness: 500, damping: 5 }),
      withSpring(6, { mass: 0.2, stiffness: 500, damping: 5 }),
      withSpring(-4, { mass: 0.2, stiffness: 500, damping: 5 }),
      withSpring(4, { mass: 0.2, stiffness: 500, damping: 5 }),
      withSpring(0, { mass: 0.2, stiffness: 500, damping: 5 })
    );
  };

  const handleConfirm = () => {
    onConfirm();
    close();
  };

  const handleCancel = () => {
    onCancel?.();
    close();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={handleOverlayPress}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.modalOverlay}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleOverlayPress}
        />

        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[styles.modalContent, contentStyle, animatedStyle]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <H2>{title}</H2>
          </View>

          <Text style={styles.description}>{description}</Text>

          <View style={styles.actions}>
            <Button
              variant="soft"
              onPress={handleCancel}
              style={styles.actionButton}
            >
              {cancelLabel}
            </Button>
            <Button onPress={handleConfirm} style={styles.actionButton}>
              {confirmLabel}
            </Button>
          </View>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
};

const ConfirmDialogTrigger = ({ children }: ConfirmDialogTriggerProps) => {
  const { open } = useContext(ConfirmDialogContext);
  return cloneElement(children, { onPress: open });
};

// Attach sub-components
ConfirmDialog.Content = ConfirmDialogContent;
ConfirmDialog.Trigger = ConfirmDialogTrigger;

const confirmDialogStyles = createStyleSheet((theme) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    width: "90%",
    maxWidth: 400,
    marginHorizontal: "auto",
    padding: theme.spacing.lg,
  },
  header: {
    paddingBottom: theme.spacing.md,
  },
  description: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
  },
  actionButton: {
    minWidth: 100,
  },
}));
