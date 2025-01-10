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
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { X } from "../icons";
import { H2 } from "./typography";
import { Button } from "./button";

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
  ...props
}: ModalContentProps) => {
  const { styles } = useStyles(modalStyles);
  const { isOpen, close } = useContext(ModalContext);

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={close}
      {...props}
    >
      <Pressable style={styles.modalOverlay} onPress={close}>
        <View
          style={[styles.modalContent, contentStyle]}
          onStartShouldSetResponder={() => true}
        >
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
        </View>
      </Pressable>
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
}));
