import { DocumentEditor } from "@/components/content/DocumentEditor";
import { Container } from "@/components/layout/Container";
import {
  KeyboardAwareLayout,
  KeyboardAwareScrollView,
  Layout,
} from "@/components/layout/Layout";
import { Section } from "@/components/layout/Section";
import { useAuth } from "@/contexts/AuthContext";
import { useFile } from "@/state/queries/directus/core";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

export default function File() {
  const { id } = useLocalSearchParams();
  const { data: file } = useFile(id as string, { fields: ["title"] });
  const { directus, token } = useAuth();
  const headerStyles = useHeaderStyles();
  const { styles } = useStyles(stylesheet);
  return (
    <KeyboardAwareLayout>
      <Stack.Screen
        options={{
          headerTitle: file?.title,
          headerBackVisible: false,
          ...headerStyles,
        }}
      />
      <KeyboardAwareScrollView>
        <Container>
          <View style={styles.imageContainer}>
            <Image
              style={styles.image}
              contentFit="contain"
              source={{
                uri: `${directus?.url}/assets/${id}`,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }}
            />
          </View>
          <DocumentEditor
            collection="directus_files"
            id={id as string}
            onDelete={() => {
              router.back();
            }}
            onSave={() => {
              router.back();
            }}
          />
        </Container>
      </KeyboardAwareScrollView>
    </KeyboardAwareLayout>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  imageContainer: {
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    overflow: "hidden",
  },
}));
