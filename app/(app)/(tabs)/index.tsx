import UserCollections from "@/components/content/UserCollections";
import { H1 } from "@/components/display/typography";
import { Container } from "@/components/layout/Container";
import { Divider } from "@/components/layout/divider";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/layout/Section";

export default function Home() {
  return (
    <Layout>
      <Container>
        <H1>Content</H1>
        <Section>
          <UserCollections />
        </Section>
      </Container>
    </Layout>
  );
}
