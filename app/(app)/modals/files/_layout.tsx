import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        presentation: "modal",
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="pick"
        options={{
          headerTitle: "",
          presentation: "modal",
          // Optional: add iOS-style modal presentation
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
