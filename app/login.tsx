import { View, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { LoginForm } from "@/components/LoginForm";

export default function Login() {
  return (
    <View style={styles.container}>
      <LoginForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
