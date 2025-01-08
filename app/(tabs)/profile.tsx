import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

export default function Profile() {
  const { logout, user } = useAuth();

  return (
    <View style={styles.container}>
      <Text>Profile Screen</Text>
      <Text>User: {user?.email}</Text>
      <Text onPress={logout} style={styles.logoutButton}>
        Logout
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  logoutButton: {
    color: "red",
    marginTop: 20,
  },
});
