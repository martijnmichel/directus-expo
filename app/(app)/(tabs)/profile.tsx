import { CollectionDataTable } from "@/components/content/CollectionDataTable";
import { FloatingToolbar } from "@/components/display/floating-toolbar";
import { Container } from "@/components/layout/Container";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/layout/Section";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollView } from "react-native";
export default function TabTwoScreen() {
  const { user } = useAuth();
  return (
    <Layout>
      <ScrollView>
        <Container>
          <Section>
            <CollectionDataTable collection="directus_users" />
          </Section>
        </Container>
      </ScrollView>

      <FloatingToolbar />
    </Layout>
  );
}
