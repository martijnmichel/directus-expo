import { DocumentEditor } from "@/components/content/DocumentEditor";
import { H1 } from "@/components/display/typography";
import { Container } from "@/components/layout/Container";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/layout/Section";
export default function TabTwoScreen() {
  return (
    <Layout>
      <Container>
        <Section>
          <DocumentEditor
            collection="directus_users"
            id="cc6e51b1-bbdf-4e45-95f6-6a5f448f3fdd"
            onSave={(doc) => console.log({ doc })}
          />
        </Section>
      </Container>
    </Layout>
  );
}
