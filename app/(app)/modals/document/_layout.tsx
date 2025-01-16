import { BackButton } from "@/components/layout/BackButton";
import { useTrackPath } from "@/hooks/useTrackPath";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="add.tsx"
        options={{
          headerTitle: "",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
