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
            id={1}
            onSave={(doc) => console.log({ doc })}
          />
        </Section>
      </Container>
    </Layout>
  );
}
