import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { Stack } from "expo-router";

export default function Layout() {
  const headerStyle = useHeaderStyles();
  return (
    <Stack>
      <Stack.Screen
        name="[collection]/index"
        options={{
          headerTitle: "",
          headerBackVisible: false,
          ...headerStyle,
        }}
      />
      <Stack.Screen
        name="[collection]/[id]/index"
        options={{
          headerTitle: "",
          headerBackVisible: false,
          ...headerStyle,
        }}
      />
    </Stack>
  );
}
