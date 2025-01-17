import { TouchableOpacity, StyleSheet, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Button } from "./button";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import React from "react";

interface FABProps {
  onPress?: () => void;
  icon: keyof typeof MaterialIcons.glyphMap;
  position?: "bottomLeft" | "bottomRight";
  children?: React.ReactNode;
  items?: Array<{
    icon: keyof typeof MaterialIcons.glyphMap;
    onPress: () => void;
  }>;
}

export function FloatingActionButton({
  onPress,
  icon,
  position = "bottomLeft",
  items,
  children,
}: FABProps) {
  const { styles } = useStyles(stylesheet);
  const [isOpen, setIsOpen] = React.useState(false);
  const animation = React.useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    setIsOpen(!isOpen);
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
    }).start();
  };

  return (
    <>
      {items && (
        <Animated.View
          style={[
            styles.menuContainer,
            position === "bottomLeft" ? styles.bottomLeft : styles.bottomRight,
          ]}
        >
          {items.map((item, index) => {
            const translateY = animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -56 * (index + 1)],
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.menuItem,
                  { transform: [{ translateY }], opacity: animation },
                ]}
              >
                {children}
              </Animated.View>
            );
          })}
        </Animated.View>
      )}

      <Button
        rounded
        style={[
          styles.fab,
          position === "bottomLeft" ? styles.bottomLeft : styles.bottomRight,
        ]}
        onPress={items ? toggleMenu : onPress}
      >
        <MaterialIcons name={icon} size={24} color="white" />
      </Button>
    </>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  fab: {
    position: "absolute",
    elevation: 4,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bottomLeft: {
    left: theme.spacing.lg,
    bottom: theme.spacing.lg,
  },
  bottomRight: {
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
  },
  menuContainer: {
    position: "absolute",
    alignItems: "center",
  },
  menuItem: {
    position: "absolute",
  },
}));
