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
import { Layout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import UserCollections from "@/components/content/UserCollections";
import { FloatingActionButton } from "@/components/display/FloatingActionButton";
import { useState, useRef, useEffect, useCallback } from "react";
import { H1, Text } from "@/components/display/typography";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { useCollections, useSettings } from "@/state/queries/directus/core";
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

  const headerStyles = useHeaderStyles();
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
    <Layout>
      <Stack.Screen
        options={{
          headerTitle: label,
          ...headerStyles,
          headerRight: () => (
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
          <ScrollView>
            <Container>{children}</Container>
          </ScrollView>
          <FloatingActionButton
            position="bottomLeft"
            icon={isMenuOpen ? "close" : "menu"}
            onPress={toggleMenu}
          />
        </Animated.View>
      </View>
    </Layout>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    position: "relative",
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
