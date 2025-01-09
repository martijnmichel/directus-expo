import { H1 } from "@/components/display/typography";
import { Container } from "@/components/layout/Container";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/layout/Section";

export default function ModalScreen() {
  return (
    <Layout>
      <Container>
        <Section>
          <H1>Modal screen</H1>
        </Section>
      </Container>
    </Layout>
  );
}
