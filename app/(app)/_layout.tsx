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
import { NotificationResponseHandler } from "@/components/NotificationResponseHandler";

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
    <>
      <NotificationResponseHandler />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/**
         *
         * Translations
         *
         */}
        <Stack.Screen
          name="modals/translations/[id]/index"
          dangerouslySingular={(_name, params) =>
            `${params?.id}--${params?.uuid}-translations`
          }
          options={{ presentation: "modal" }}
        />

        {/**
         *
         * M2M
         *
         */}
        <Stack.Screen
          name="modals/m2m/[collection]/add"
          dangerouslySingular={(_name, params) =>
            `${params?.collection}-${params?.item_field}-${params?.uuid}-add-m2m`
          }
          options={{ presentation: "fullScreenModal" }}
        />
        <Stack.Screen
          name="modals/m2m/[collection]/pick"
          dangerouslySingular={(_name, params) =>
            `${params?.related_collection}-${params?.junction_collection}-${params?.item_field}-${params?.uuid}-pick-m2m`
          }
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="modals/m2m/[collection]/[id]/index"
          dangerouslySingular={(_name, params) =>
            `${params?.collection}-${params?.id}-${params?.item_field}-${params?.uuid}-edit-m2m`
          }
          options={{ presentation: "modal" }}
        />

        {/**
         *
         * M2A
         *
         */}
        <Stack.Screen
          name="modals/m2a/[collection]/add"
          dangerouslySingular={(_name, params) =>
            `${params?.collection}-${params?.item_field}-${params?.document_session_id}-add-m2a`
          }
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="modals/m2a/[collection]/pick"
          dangerouslySingular={(_name, params) =>
            `${params?.related_collection}-${params?.junction_collection}-${params?.item_field}-${params?.document_session_id}-pick-m2a`
          }
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="modals/m2a/[collection]/[id]/index"
          dangerouslySingular={(_name, params) =>
            `${params?.collection}-${params?.id}-${params?.item_field}-${params?.document_session_id}-edit-m2a`
          }
          options={{ presentation: "modal" }}
        />

        {/**
         *
         * M2O
         *
         */}
        <Stack.Screen
          name="modals/m2o/[collection]/pick"
          dangerouslySingular={(_name, params) =>
            `${params?.collection}-${params?.data}-${params?.uuid}-pick-m2o`
          }
          options={{ presentation: "modal" }}
        />

        <Stack.Screen
          name="modals/m2o/[collection]/[id]/index"
          dangerouslySingular={(_name, params) =>
            `${params?.collection}-${params?.id}-${params?.item_field}-${params?.document_session_id}-edit-m2o`
          }
          options={{ presentation: "modal" }}
        />

        <Stack.Screen
          name="modals/m2o/[collection]/add"
          dangerouslySingular={(_name, params) =>
            `${params?.collection}-${params?.item_field}-${params?.document_session_id}-add-m2o`
          }
          options={{ presentation: "modal" }}
        />
        {/**
         *
         * O2M
         *
         */}
        <Stack.Screen
          name="modals/o2m/[collection]/pick"
          dangerouslySingular={(_name, params) =>
            `${params?.collection}-${params?.item_field}-${params?.document_session_id}-pick-o2m`
          }
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="modals/o2m/[collection]/[id]/index"
          dangerouslySingular={(_name, params) =>
            `${params?.collection}-${params?.id}-${params?.item_field}-${params?.document_session_id}-${params?.uuid}-edit-o2m`
          }
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="modals/o2m/[collection]/add"
          dangerouslySingular={(_name, params) =>
            `${params?.collection}-${params?.item_field}-${params?.document_session_id}-${params?.uuid}-add-o2m`
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
          dangerouslySingular={(_name, params) =>
            `${params?.collection}-${params?.fields}-${params?.uuid}-add-repeater`
          }
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="modals/repeater/edit"
          dangerouslySingular={(_name, params) =>
            `${params?.collection}-${params?.fields}-${params?.uuid}-edit-repeater`
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
          dangerouslySingular={(_name, params) => `${params?.data}-pick-files`}
          options={{ presentation: "modal" }}
        />

        <Stack.Screen
          name="modals/dynamic"
          options={{
            presentation: "modal", // Native modal behavior
            headerShown: true,
          }}
        />
      </Stack>
    </>
  );
}
