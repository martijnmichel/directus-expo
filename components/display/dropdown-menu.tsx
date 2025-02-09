import React, {
  createContext,
  useContext,
  useState,
  cloneElement,
  isValidElement,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Modal as RNModal,
  Pressable,
  StyleSheet,
  Dimensions,
  LayoutChangeEvent,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface DropdownContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  triggerRef: React.RefObject<View>;
}

const DropdownContext = createContext<DropdownContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
  triggerRef: { current: null },
});

interface Position {
  top: number;
  left: number;
  right?: number;
}

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

interface DropdownTriggerProps {
  children: React.ReactNode;
}

interface DropdownContentProps {
  children: React.ReactNode;
}

function Trigger({ children }: DropdownTriggerProps) {
  const { toggle, triggerRef } = useContext(DropdownContext);

  if (isValidElement(children)) {
    return cloneElement(children, {
      onPress: toggle,
      ref: triggerRef,
    });
  }

  return (
    <Pressable ref={triggerRef} onPress={toggle}>
      {children}
    </Pressable>
  );
}

function Content({ children }: DropdownContentProps) {
  const { isOpen, close, triggerRef } = useContext(DropdownContext);
  const { styles } = useStyles(stylesheet);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        const windowWidth = Dimensions.get("window").width;
        const windowHeight = Dimensions.get("window").height;

        let newPosition: Position = {
          top: y + height + 4,
          left: x,
        };

        if (x + contentSize.width > windowWidth) {
          newPosition = {
            ...newPosition,
            left: undefined,
            right: 16,
          };
        }

        if (y + height + contentSize.height > windowHeight) {
          newPosition.top = y - contentSize.height - 4;
        }

        setPosition(newPosition);
      });
    }
  }, [isOpen, contentSize]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContentSize({ width, height });
  };

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={close}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={close}>
        <View
          style={[
            styles.dropdownContainer,
            {
              position: "absolute",
              ...position,
              minWidth: contentSize.width,
            },
          ]}
          onLayout={handleLayout}
        >
          <Pressable>{children}</Pressable>
        </View>
      </Pressable>
    </RNModal>
  );
}

function DropdownMenuComponent({
  children,
  open,
  onOpenChange,
}: DropdownMenuProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const { styles } = useStyles(stylesheet);
  const triggerRef = useRef<View>(null);

  const isOpen = open !== undefined ? open : internalIsOpen;

  const openDropdown = () => {
    setInternalIsOpen(true);
    onOpenChange?.(true);
  };

  const closeDropdown = () => {
    setInternalIsOpen(false);
    onOpenChange?.(false);
  };

  const toggleDropdown = () => {
    const newState = !isOpen;
    setInternalIsOpen(newState);
    onOpenChange?.(newState);
  };

  return (
    <DropdownContext.Provider
      value={{
        isOpen,
        open: openDropdown,
        close: closeDropdown,
        toggle: toggleDropdown,
        triggerRef,
      }}
    >
      <View style={styles.wrapper}>{children}</View>
    </DropdownContext.Provider>
  );
}

type DropdownMenuType = typeof DropdownMenuComponent & {
  Trigger: typeof Trigger;
  Content: typeof Content;
};

const DropdownMenu = DropdownMenuComponent as DropdownMenuType;
DropdownMenu.Trigger = Trigger;
DropdownMenu.Content = Content;

export { DropdownMenu };

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
});

const stylesheet = createStyleSheet((theme) => ({
  dropdownContainer: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    shadowColor: theme.colors.textSecondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3.84,
    elevation: 5,
  },
  wrapper: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
}));
