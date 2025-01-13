import { View, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { LoginForm } from "@/components/LoginForm";
import { Center } from "@/components/layout/Center";
import { Container } from "@/components/layout/Container";
import { KeyboardAwareLayout, Layout } from "@/components/layout/Layout";

export default function Login() {
  return (
    <KeyboardAwareLayout>
      <Container>
        <Center>
          <LoginForm />
        </Center>
      </Container>
    </KeyboardAwareLayout>
  );
}
