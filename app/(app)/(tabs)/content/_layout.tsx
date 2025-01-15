import { BackButton } from "@/components/layout/BackButton";
import { useTrackPath } from "@/hooks/useTrackPath";
import { Stack } from "expo-router";

export default function Layout() {
  useTrackPath();
  return (
    <Stack>
      <Stack.Screen
        name="[collection]/index"
        options={{ headerTitle: "", headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen
        name="[collection]/[id]/index"
        options={{ headerTitle: "", headerLeft: () => <BackButton /> }}
      />
    </Stack>
  );
}
