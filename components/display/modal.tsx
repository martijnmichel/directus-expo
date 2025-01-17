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
  ScrollView,
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
import { PortalHost } from "../layout/Portal";
import { useTranslation } from "react-i18next";

interface ModalContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const ModalContext = createContext<ModalContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

interface ModalProps {
  children: React.ReactNode;
}

interface ModalContentProps {
  title?: string;
  children:
    | React.ReactNode
    | ((props: { close: () => void }) => React.ReactNode);
  contentStyle?: ViewStyle;
  variant?: "default" | "bottomSheet";
  height?: number | `${number}%` | "auto";
  actions?: React.ReactNode;
  visible?: boolean;
  onRequestClose?: () => void;
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
  actions,
  variant = "default",
  height = "90%",
  ...props
}: ModalContentProps) => {
  const { t } = useTranslation();
  const { styles } = useStyles(modalStyles);
  const { isOpen, close } = useContext(ModalContext);

  const contentStyles = [
    styles.modalContent,
    variant === "bottomSheet" && {
      ...styles.bottomSheetContent,
      height: typeof height === "number" ? height : height,
    },
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

        {variant === "bottomSheet" && (
          <Button
            onPress={close}
            variant="soft"
            rounded
            style={styles.closeButton}
          >
            <X size={24} aria-label={t("components.modal.close")} />
          </Button>
        )}

        <Animated.View
          entering={
            variant === "bottomSheet" ? SlideInDown.duration(200) : FadeIn
          }
          exiting={
            variant === "bottomSheet" ? SlideOutDown.duration(200) : FadeOut
          }
          style={contentStyles}
          onStartShouldSetResponder={() => true}
        >
          {variant === "bottomSheet" && (
            <View style={styles.bottomSheetHandle} />
          )}

          <View style={styles.header}>
            <View style={styles.headerContent}>
              {title && <H2>{title}</H2>}
              {actions && <View style={styles.actions}>{actions}</View>}
              <PortalHost name="modal-header" />
            </View>
          </View>

          {isOpen && (
            <ScrollView>
              {typeof children === "function" ? children({ close }) : children}
            </ScrollView>
          )}
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
    paddingBottom: theme.spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  bottomSheetOverlay: {
    justifyContent: "flex-end",
    padding: 0,
  },
  bottomSheetContent: {
    width: "100%",
    maxWidth: "100%",
    marginHorizontal: 0,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  bottomSheetHandle: {
    width: 36,
    height: 5,
    backgroundColor: theme.colors.border,
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: theme.spacing.sm,
  },
  closeButtonWrapper: {
    position: "absolute",
    top: theme.spacing.xl,
    right: theme.spacing.lg,
    zIndex: 1,
  },
  closeButton: {
    marginLeft: "auto",
    marginRight: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: theme.typography.heading2.fontSize,
    fontFamily: theme.typography.heading2.fontFamily,
    color: theme.colors.textPrimary,
  },
}));
