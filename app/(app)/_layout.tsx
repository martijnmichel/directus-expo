import { Text } from "@/components/display/typography";
import { Center } from "@/components/layout/Center";
import { PortalProvider } from "@/components/layout/Portal";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { Redirect, Slot, Stack, Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";
import { UnistylesRuntime, useStyles } from "react-native-unistyles";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  // Add loading check
  if (isLoading) {
    return (
      <Center>
        <ActivityIndicator size="large" />
        <Text>{t("components.loading.text")}</Text>
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/**
       *
       * M2M
       *
       */}
      <Stack.Screen
        name="modals/m2m/[collection]/add"
        getId={({ params }) =>
          `${params?.collection}-${params?.item_field}-add-m2m`
        }
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="modals/m2m/[collection]/pick"
        getId={({ params }) =>
          `${params?.related_collection}-${params?.junction_collection}-${params?.item_field}-pick-m2m`
        }
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="modals/m2m/[collection]/[id]/index"
        getId={({ params }) => `${params?.collection}-${params?.id}-edit-m2m`}
        options={{ presentation: "modal" }}
      />

      {/**
       *
       * M2A
       *
       */}
      <Stack.Screen
        name="modals/m2a/[collection]/add"
        getId={({ params }) =>
          `${params?.collection}-${params?.item_field}-add-m2a`
        }
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="modals/m2a/[collection]/pick"
        getId={({ params }) =>
          `${params?.related_collection}-${params?.junction_collection}-${params?.item_field}-pick-m2a`
        }
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="modals/m2a/[collection]/[id]/index"
        getId={({ params }) => `${params?.collection}-${params?.id}-edit-m2a`}
        options={{ presentation: "modal" }}
      />

      {/**
       *
       * M2O
       *
       */}
      <Stack.Screen
        name="modals/m2o/[collection]/pick"
        getId={({ params }) => `${params?.collection}-${params?.data}-pick-m2o`}
        options={{ presentation: "modal" }}
      />

      {/**
       *
       * O2M
       *
       */}
      <Stack.Screen
        name="modals/o2m/[collection]/pick"
        getId={({ params }) =>
          `${params?.collection}-${params?.item_field}-pick-o2m`
        }
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="modals/o2m/[collection]/[id]/index"
        getId={({ params }) => `${params?.collection}-${params?.id}-edit-o2m`}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="modals/o2m/[collection]/add"
        getId={({ params }) =>
          `${params?.collection}-${params?.item_field}-add-o2m`
        }
        options={{ presentation: "modal" }}
      />

      {/**
       *
       * Repeater
       *
       */}
      <Stack.Screen
        name="modals/repeater/add"
        getId={({ params }) =>
          `${params?.collection}-${params?.fields}-add-repeater`
        }
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="modals/repeater/edit"
        getId={({ params }) =>
          `${params?.collection}-${params?.fields}-edit-repeater`
        }
        options={{ presentation: "modal" }}
      />

      {/**
       *
       * Files
       *
       */}
      <Stack.Screen
        name="modals/files/pick"
        getId={({ params }) => `${params?.data}-pick-files`}
        options={{ presentation: "modal" }}
      />
    </Stack>
  );
}
