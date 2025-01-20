import { CollectionDataTable } from "@/components/content/CollectionDataTable";
import { Button } from "@/components/display/button";
import { FloatingToolbar } from "@/components/display/floating-toolbar";
import { Modal } from "@/components/display/modal";
import { Plus } from "@/components/icons";
import { FileBrowser } from "@/components/interfaces/file-browser";
import { ImageInput } from "@/components/interfaces/image-input";
import { Container } from "@/components/layout/Container";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/layout/Section";
import { Horizontal } from "@/components/layout/Stack";
import { useAuth } from "@/contexts/AuthContext";
import { isActionAllowed } from "@/helpers/permissions/isActionAllowed";
import { usePermissions } from "@/state/queries/directus/core";
import { CoreSchema } from "@directus/sdk";
import { Link, Stack } from "expo-router";
import { ScrollView } from "react-native";
export default function TabTwoScreen() {
  const { user } = useAuth();
  const { data: permissions } = usePermissions();

  const canCreate = isActionAllowed("directus_files", "create", permissions);
  return (
    <Layout>
      <Horizontal style={{ justifyContent: "flex-end" }}>
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

      <ScrollView>
        <Container>
          <FileBrowser />
        </Container>
      </ScrollView>
    </Layout>
  );
}
