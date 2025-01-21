import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Pressable,
} from "react-native";
import RNAnimated from "react-native-reanimated";
import { Layout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import UserCollections from "@/components/content/UserCollections";
import { FloatingActionButton } from "@/components/display/FloatingActionButton";
import { useState, useRef, useEffect, useCallback } from "react";
import { H1, Text } from "@/components/display/typography";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import {
  useCollections,
  usePermissions,
  useSettings,
} from "@/state/queries/directus/core";
import { useCollection } from "@/state/queries/directus/collection";
import { CoreSchema } from "@directus/sdk";
import { DocumentEditor } from "@/components/content/DocumentEditor";
import { CollectionDataTable } from "@/components/content/CollectionDataTable";
import {
  Link,
  router,
  Stack,
  useLocalSearchParams,
  usePathname,
} from "expo-router";
import { Section } from "@/components/layout/Section";
import {
  getCollectionTranslation,
  useCollectionMeta,
} from "@/helpers/collections/getCollectionTranslation";
import { FadeIn, FadeOut } from "react-native-reanimated";
import { Plus } from "../icons";
import { Button } from "../display/button";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { Modal } from "../display/modal";
import { Input } from "../interfaces/input";
import { Horizontal } from "./Stack";
import { DirectusIcon } from "../display/directus-icon";
import { PortalHost, PortalOutlet } from "./Portal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isActionAllowed } from "@/helpers/permissions/isActionAllowed";

export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: collections } = useCollections();
  const { collection } = useLocalSearchParams();
  const { data, isLoading } = useCollection(collection as keyof CoreSchema);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pathname = usePathname();
  const { styles } = useStyles(stylesheet);
  const { label } = useCollectionMeta(data);
  const { data: settings } = useSettings();
  const { bottom } = useSafeAreaInsets();
  const headerStyles = useHeaderStyles();
  const { data: permissions } = usePermissions();
  const collectionPermissions = permissions?.[collection as keyof CoreSchema];
  console.log({ collectionPermissions });
  const canCreate = isActionAllowed(
    collection as keyof CoreSchema,
    "create",
    permissions
  );

  const closeMenu = useCallback(() => {
    console.log("Closing menu");
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsMenuOpen(false);
      }
    });
  }, [slideAnim]);

  const openMenu = useCallback(() => {
    console.log("Opening menu");
    setIsMenuOpen(true); // Set this immediately for open
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const toggleMenu = () => {
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: label,
          ...headerStyles,
          headerRight: () =>
            canCreate && (
              <Link href={`/content/${collection}/+`} asChild>
                <Button rounded>
                  <Plus />
                </Button>
              </Link>
            ),
        }}
      />
      <View style={[styles.container, { position: "relative" }]}>
        <Animated.View
          style={[
            styles.sideMenu,
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-300, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Horizontal style={styles.sideMenuHeader}>
            <DirectusIcon name="msSolarPower" size={24} />
            <Text>{settings?.project_name}</Text>
          </Horizontal>
          <View style={styles.sideMenuContent}>
            <UserCollections />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.mainContent,
            isMenuOpen && styles.overlay,
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 300],
                  }),
                },
              ],
            },
          ]}
        >
          {children}

          <View style={styles.floatingToolbar}>
            <Horizontal>
              <Button rounded floating onPress={toggleMenu}>
                <DirectusIcon name={isMenuOpen ? "close" : "menu"} />
              </Button>

              {!isMenuOpen && (
                <RNAnimated.View entering={FadeIn}>
                  <Horizontal>
                    <PortalHost key={pathname} name="floating-toolbar" />
                  </Horizontal>
                </RNAnimated.View>
              )}
            </Horizontal>
          </View>
        </Animated.View>
      </View>
    </>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    position: "relative",
  },
  floatingToolbar: {
    position: "absolute",
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.0)",
    zIndex: 1,
  },
  sideMenu: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: theme.colors.backgroundAlt,
    zIndex: 1,
  },
  sideMenuHeader: {
    backgroundColor: theme.colors.backgroundDark,
    padding: theme.spacing.md,
  },
  sideMenuContent: {
    padding: theme.spacing.md,
  },
  mainContent: {
    flex: 1,
    backgroundColor: theme.colors.background,
    zIndex: 0,
  },
}));
