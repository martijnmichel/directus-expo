import { TouchableOpacity, StyleSheet, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Button } from "./button";

interface FABProps {
  onPress: () => void;
  icon: keyof typeof MaterialIcons.glyphMap;
  position?: "bottomLeft" | "bottomRight";
}

export function FloatingActionButton({
  onPress,
  icon,
  position = "bottomLeft",
}: FABProps) {
  return (
    <Button
      rounded
      style={[
        styles.fab,
        position === "bottomLeft" ? styles.bottomLeft : styles.bottomRight,
      ]}
      onPress={onPress}
    >
      <MaterialIcons name={icon} size={24} color="white" />
    </Button>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bottomLeft: {
    left: 16,
    bottom: 16,
  },
  bottomRight: {
    right: 16,
    bottom: 16,
  },
});
