import { CollectionDataTable } from "@/components/content/CollectionDataTable";
import { DocumentEditor } from "@/components/content/DocumentEditor";
import { H1 } from "@/components/display/typography";
import { Container } from "@/components/layout/Container";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/layout/Section";
import { useAuth } from "@/contexts/AuthContext";
import { useMe } from "@/state/queries/directus/core";
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
    </Layout>
  );
}
