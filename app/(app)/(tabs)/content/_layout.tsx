import { BackButton } from "@/components/layout/BackButton";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="[collection]/index"
        options={{ headerTitle: "", headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen
        name="[collection]/[id]/index"
        options={{ presentation: "modal" }}
      />
    </Stack>
  );
}
