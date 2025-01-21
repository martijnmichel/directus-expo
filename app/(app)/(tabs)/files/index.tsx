import { CollectionDataTable } from "@/components/content/CollectionDataTable";
import { FileBrowser } from "@/components/content/FileBrowser";
import { Button } from "@/components/display/button";
import { DirectusIcon } from "@/components/display/directus-icon";
import {
  FloatingToolbar,
  ftStyles,
} from "@/components/display/floating-toolbar";
import { Modal } from "@/components/display/modal";
import { Plus } from "@/components/icons";
import { ImageInput } from "@/components/interfaces/image-input";
import { Container } from "@/components/layout/Container";
import { Layout } from "@/components/layout/Layout";
import { PortalHost } from "@/components/layout/Portal";
import { Section } from "@/components/layout/Section";
import { Horizontal } from "@/components/layout/Stack";
import { useAuth } from "@/contexts/AuthContext";
import { isActionAllowed } from "@/helpers/permissions/isActionAllowed";
import { usePermissions } from "@/state/queries/directus/core";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { CoreSchema } from "@directus/sdk";
import { Link, Stack } from "expo-router";
import { ScrollView, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useStyles } from "react-native-unistyles";
export default function TabTwoScreen() {
  const { user } = useAuth();
  const { styles } = useStyles(ftStyles);
  const { data: permissions } = usePermissions();

  const headerStyles = useHeaderStyles();

  const canCreate = isActionAllowed("directus_files", "create", permissions);
  return (
    <Layout>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Files",
          ...headerStyles,
          headerRight: () => {
            return (
              <Horizontal>
                {canCreate && (
                  <Modal>
                    <Modal.Trigger>
                      <Button rounded>
                        <Plus />
                      </Button>
                    </Modal.Trigger>
                    <Modal.Content>
                      <ImageInput sources={["device", "url"]} />
                    </Modal.Content>
                  </Modal>
                )}
              </Horizontal>
            );
          },
        }}
      />

      <ScrollView>
        <Container>
          <FileBrowser />
        </Container>
      </ScrollView>

      <View style={styles.toolbar}>
        <Horizontal>
          <Animated.View entering={FadeIn}>
            <Horizontal>
              <PortalHost name="floating-toolbar" />
            </Horizontal>
          </Animated.View>
        </Horizontal>
      </View>
    </Layout>
  );
}
