import { View, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { LoginForm } from "@/components/LoginForm";
import { Center } from "@/components/layout/Center";
import { Container } from "@/components/layout/Container";
import { KeyboardAwareLayout, Layout } from "@/components/layout/Layout";
import { useThemeToggle } from "@/unistyles/useThemeToggle";
import { Button } from "@/components/display/button";
import { Sun } from "@/components/icons/Sun";
import { Moon } from "@/components/icons/Moon";

export default function Login() {
  const { toggleTheme, currentTheme } = useThemeToggle();

  return (
    <KeyboardAwareLayout>
      <Container>
        <Center>
          <LoginForm />
          <Button variant="ghost" onPress={toggleTheme}>
            {currentTheme === "dark" ? <Sun /> : <Moon />}
          </Button>
        </Center>
      </Container>
    </KeyboardAwareLayout>
  );
}
