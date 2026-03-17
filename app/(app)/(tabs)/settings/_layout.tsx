import { Cog } from "@/components/icons/Cog";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function Layout() {
  const headerStyle = useHeaderStyles();
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: t("components.tabs.settings"),
          
          ...headerStyle,
        }}
      />
      <Stack.Screen
        name="widget/[id]"
        options={{
          headerTitle: "",
          headerBackVisible: false,
          ...headerStyle,
        }}
      />
    </Stack>
  );
}
