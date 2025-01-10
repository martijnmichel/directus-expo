import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Slot, Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();

  // Add loading check
  if (isLoading) {
    return null; // or return a loading spinner
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Slot />;
}
