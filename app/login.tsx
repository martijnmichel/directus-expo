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
import { LocaleSelect } from "@/components/settings/locale-switch";
import { Horizontal, Vertical } from "@/components/layout/Stack";

export default function Login() {
  const { toggleTheme, currentTheme } = useThemeToggle();

  return (
    <KeyboardAwareLayout>
      <Container>
        <Vertical
          style={{
            flex: 1,
            justifyContent: "center",
            maxWidth: 500,
            marginHorizontal: "auto",
          }}
        >
          <LoginForm />
          <Horizontal style={{ justifyContent: "space-between" }}>
            <LocaleSelect />
            <Button variant="ghost" onPress={toggleTheme}>
              {currentTheme === "dark" ? <Sun /> : <Moon />}
            </Button>
          </Horizontal>
        </Vertical>
      </Container>
    </KeyboardAwareLayout>
  );
}
