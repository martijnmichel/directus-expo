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
import { useState, useRef, useEffect } from "react";
import { H1 } from "@/components/display/typography";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { useCollections } from "@/state/queries/directus/core";
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

export default function CollectionLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: collections } = useCollections();
  const { collection } = useLocalSearchParams();
  const { data, isLoading } = useCollection(collection as keyof CoreSchema);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pathname = usePathname();
  const { styles } = useStyles(stylesheet);
  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      setIsMenuOpen(false);
    });
  };

  const openMenu = () => {
    setIsMenuOpen(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isMenuOpen,
      onMoveShouldSetPanResponder: () => isMenuOpen,
      onPanResponderMove: (_, gestureState) => {
        if (!isMenuOpen) return;
        const newValue = Math.max(0, Math.min(1, 1 + gestureState.dx / 300));
        slideAnim.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          closeMenu();
        } else {
          openMenu();
        }
      },
    })
  ).current;

  const { label } = useCollectionMeta(data);

  const headerStyles = useHeaderStyles();

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
      <View style={styles.container}>
        {isMenuOpen && <Pressable style={styles.overlay} onPress={closeMenu} />}

        <Animated.View
          {...panResponder.panHandlers}
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
          <UserCollections />
        </Animated.View>

        <Animated.View
          style={[
            styles.mainContent,
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
          pointerEvents={isMenuOpen ? "none" : "auto"}
        >
          <ScrollView>
            <Container>
              <Section>
                {data?.meta.singleton ? (
                  <DocumentEditor collection={collection as keyof CoreSchema} />
                ) : (
                  <CollectionDataTable
                    collection={collection as keyof CoreSchema}
                  />
                )}
              </Section>
            </Container>
          </ScrollView>
        </Animated.View>

        {!isMenuOpen && !data?.meta.singleton && (
          <FloatingActionButton
            icon={isMenuOpen ? "close" : "menu"}
            onPress={toggleMenu}
          />
        )}
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
    backgroundColor: theme.colors.backgroundDark,
    zIndex: 2, // Increased zIndex to be above overlay
    padding: theme.spacing.md,
  },
  mainContent: {
    flex: 1,
    backgroundColor: "white",
  },
}));
