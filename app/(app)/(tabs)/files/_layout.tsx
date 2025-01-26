import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { Stack } from "expo-router";

export default function Layout() {
  const headerStyles = useHeaderStyles();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Files",
          headerBackVisible: false,
          ...headerStyles,
        }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{
          headerTitle: "File",
          headerBackVisible: false,
          ...headerStyles,
        }}
      />
    </Stack>
  );
}
