import React, {
  createContext,
  useContext,
  useState,
  cloneElement,
} from "react";
import {
  Modal as RNModal,
  View,
  Pressable,
  ModalProps as RNModalProps,
  ViewStyle,
  StyleSheet,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { X } from "../icons";
import { H2 } from "./typography";
import { Button } from "./button";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface ModalContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

interface ModalProps {
  children: React.ReactNode;
}

interface ModalContentProps
  extends Omit<RNModalProps, "transparent" | "animationType"> {
  title?: string;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
  variant?: "default" | "bottomSheet";
  height?: number | string;
}

interface ModalTriggerProps {
  children: React.ReactElement;
}

export const Modal = ({ children }: ModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <ModalContext.Provider value={{ isOpen, open, close }}>
      {children}
    </ModalContext.Provider>
  );
};

const ModalContent = ({
  title,
  children,
  contentStyle,
  variant = "default",
  height = "70%",
  ...props
}: ModalContentProps) => {
  const { styles } = useStyles(modalStyles);
  const { isOpen, close } = useContext(ModalContext);

  const contentStyles = [
    styles.modalContent,
    variant === "bottomSheet" && [
      styles.bottomSheetContent,
      { height: height },
    ],
    contentStyle,
  ];

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={close}
      {...props}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[
          styles.modalOverlay,
          variant === "bottomSheet" && styles.bottomSheetOverlay,
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <Animated.View
          entering={
            variant === "bottomSheet" ? SlideInDown.springify() : FadeIn
          }
          exiting={
            variant === "bottomSheet" ? SlideOutDown.springify() : FadeOut
          }
          style={contentStyles}
          onStartShouldSetResponder={() => true}
        >
          {variant === "bottomSheet" && (
            <View style={styles.bottomSheetHandle} />
          )}
          <View style={styles.header}>
            {title && <H2>{title}</H2>}
            <Button
              variant="ghost"
              rounded
              onPress={close}
              style={styles.closeButton}
            >
              <X />
            </Button>
          </View>
          {children}
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
};

const ModalTrigger = ({ children }: ModalTriggerProps) => {
  const { open } = useContext(ModalContext);

  return cloneElement(children, {
    onPress: open,
  });
};

// Attach sub-components to Modal
Modal.Content = ModalContent;
Modal.Trigger = ModalTrigger;

const modalStyles = createStyleSheet((theme) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    maxHeight: "80%",
    width: "90%",
    maxWidth: 500,
    marginHorizontal: "auto",
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: theme.spacing.lg,
  },
  closeButton: {
    marginLeft: "auto",
  },
  bottomSheetOverlay: {
    justifyContent: "flex-end",
    padding: 0,
  },
  bottomSheetContent: {
    width: "100%",
    maxWidth: "100%",
    marginHorizontal: 0,
    borderRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: theme.spacing.sm,
  },
  bottomSheetHandle: {
    width: 36,
    height: 5,
    backgroundColor: theme.colors.border,
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: theme.spacing.sm,
  },
}));
